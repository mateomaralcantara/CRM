"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = { projectId: string; initialHTML: string };

function useDebounce<T>(value: T, ms = 700) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Editor({ projectId, initialHTML }: Props) {
  const sb = useMemo(() => supabaseBrowser() as any, []);
  const ref = useRef<HTMLDivElement | null>(null);

  // Estado del documento y controles
  const [html, setHtml] = useState<string>(initialHTML || "");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [full, setFull] = useState(false);
  const [foreColor, setForeColor] = useState("#e5e7eb");
  const [font, setFont] = useState("inherit");
  const [fontSize, setFontSize] = useState("4"); // 1..7 (execCommand)

  const debounced = useDebounce(html, 700);

  // Inicializa el contenido **una sola vez** (evita que React sobrescriba mientras escribes)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHTML || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-guardado con debounce
  useEffect(() => {
    if (!ref.current) return;
    const current = ref.current.innerHTML;
    if (debounced === initialHTML && current === initialHTML) return;

    let cancelled = false;
    (async () => {
      setSaving("saving");
      const { error } = await sb
        .from("projects")
        .update({ content: debounced })
        .eq("id", projectId);

      if (cancelled) return;
      setSaving(error ? "error" : "saved");
      if (!error) setTimeout(() => setSaving("idle"), 900);
    })();

    return () => { cancelled = true; };
  }, [debounced, initialHTML, projectId, sb]);

  // Helpers de edición
  function cmd(command: string, value?: string) {
    document.execCommand(command, false, value);
    ref.current?.focus();
    setHtml(ref.current?.innerHTML || "");
  }

  function onInput() {
    setHtml(ref.current?.innerHTML || "");
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // pega como texto plano (limpio)
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    setHtml(ref.current?.innerHTML || "");
  }

  const showPH = !html || html === "<br>";

  return (
    <div className={`rte-wrap ${full ? "rte-full" : ""}`} style={{ border: "1px solid #1f2937", borderRadius: 12 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: 8, padding: 8,
          borderBlockEnd: "1px solid #1f2937",
          background: "rgba(17,24,39,.6)", backdropFilter: "blur(8px)",
          position: "sticky", insetBlockStart: 0, zIndex: 5,
          borderStartStartRadius: 12, borderStartEndRadius: 12
        }}
        onMouseDown={(e) => {
          // Evita que el toolbar robe el foco; mantenlo en el canvas
          e.preventDefault();
        }}
      >
        {/* Bloques */}
        <button type="button" className="btn-ghost" onClick={() => cmd("formatBlock", "H1")}>H1</button>
        <button type="button" className="btn-ghost" onClick={() => cmd("formatBlock", "H2")}>H2</button>
        <button type="button" className="btn-ghost" onClick={() => cmd("formatBlock", "P")}>P</button>

        <span style={{ inlineSize: 8 }} />

        {/* Estilos básicos */}
        <button type="button" onClick={() => cmd("bold")}>Negrita</button>
        <button type="button" onClick={() => cmd("italic")}>Cursiva</button>
        <button type="button" onClick={() => cmd("underline")}>Subrayado</button>

        <span style={{ inlineSize: 8 }} />

        {/* Listas & cita */}
        <button type="button" className="btn-secondary" onClick={() => cmd("insertUnorderedList")}>• Lista</button>
        <button type="button" className="btn-secondary" onClick={() => cmd("insertOrderedList")}>1. Lista</button>
        <button type="button" className="btn-secondary" onClick={() => cmd("formatBlock", "BLOCKQUOTE")}>“ Cita</button>
        <button type="button" className="btn-secondary" onClick={() => cmd("insertHorizontalRule")}>— Separador</button>

        <span style={{ inlineSize: 8 }} />

        {/* Alineación */}
        <button type="button" className="btn-ghost" onClick={() => cmd("justifyLeft")}>Izq</button>
        <button type="button" className="btn-ghost" onClick={() => cmd("justifyCenter")}>Centro</button>
        <button type="button" className="btn-ghost" onClick={() => cmd("justifyRight")}>Der</button>
        <button type="button" className="btn-ghost" onClick={() => cmd("justifyFull")}>Justificar</button>

        <span style={{ inlineSize: 8 }} />

        {/* Tipografías */}
        <select
          className="btn-ghost"
          value={font}
          onChange={(e) => { setFont(e.target.value); cmd("fontName", e.target.value); }}
          style={{ padding: "8px 10px" }}
        >
          <option value="inherit">Tipografía</option>
          <option>Segoe UI</option>
          <option>Arial</option>
          <option>Roboto</option>
          <option>Inter</option>
          <option>Georgia</option>
          <option>"Times New Roman"</option>
          <option>"Courier New"</option>
          <option>Monaco</option>
        </select>

        <select
          className="btn-ghost"
          value={fontSize}
          onChange={(e) => { setFontSize(e.target.value); cmd("fontSize", e.target.value); }}
          style={{ padding: "8px 10px" }}
        >
          <option value="3">Tamaño</option>
          <option value="2">Pequeño</option>
          <option value="3">Normal</option>
          <option value="4">Grande</option>
          <option value="5">Enorme</option>
        </select>

        {/* Color de texto */}
        <label className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span>Color</span>
          <input
            type="color"
            value={foreColor}
            onChange={(e) => { setForeColor(e.target.value); cmd("foreColor", e.target.value); }}
            style={{ inlineSize: 28, blockSize: 28, padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
          />
        </label>

        <span style={{ flex: 1 }} />

        {/* Undo / Redo / Limpiar */}
        <button type="button" className="btn-ghost" onClick={() => cmd("undo")}>Deshacer</button>
        <button type="button" className="btn-ghost" onClick={() => cmd("redo")}>Rehacer</button>
        <button type="button" className="btn-ghost" onClick={() => cmd("removeFormat")}>Limpiar</button>

        <small style={{ color: "#9aa3b2", marginInlineStart: 8 }}>
          {saving === "saving" && "Guardando…"}
          {saving === "saved" && "Guardado ✅"}
          {saving === "error" && "Error al guardar"}
        </small>

        <button type="button" className="btn-ghost" onClick={() => setFull(v => !v)}>
          {full ? "Salir pantalla completa" : "Pantalla completa"}
        </button>
      </div>

      {/* Canvas editable */}
      <div
        ref={ref}
        className="rte"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={onInput}
        onPaste={onPaste}
        onClick={() => ref.current?.focus()}
        style={{
          minBlockSize: 420,
          padding: 16,
          outline: "none",
          cursor: "text",
          background: "rgba(15,23,42,.6)",
          borderEndStartRadius: 12,
          borderEndEndRadius: 12,
          userSelect: "text",
          WebkitUserSelect: "text",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        data-placeholder={showPH ? "Escribe aquí los detalles del proyecto…" : ""}
      />

      <style jsx>{`
        .rte:empty::before,
        .rte[data-placeholder]:not([data-placeholder=""])::before {
          content: attr(data-placeholder);
          color: #9aa3b2;
          pointer-events: none; /* <- no bloquea el click/escritura */
        }
        .rte h1 { font-size: 1.6rem; margin: .6em 0 .3em; }
        .rte h2 { font-size: 1.3rem; margin: .6em 0 .3em; }
        .rte p  { line-height: 1.6; margin: .5em 0; }
        .rte blockquote {
          border-inline-start: 3px solid #334155;
          margin: .6em 0; padding: .4em .8em; color: #cbd5e1;
        }
        .rte-full { position: fixed; inset: 24px; z-index: 40; background: #0b1220; box-shadow: 0 10px 40px rgba(0,0,0,.45); }
      `}</style>
    </div>
  );
}
