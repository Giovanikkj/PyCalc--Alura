import React, { useState } from 'react';
import { Copy, Check, Download, X, Terminal, Code2 } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PYTHON_SCRIPT_CONTENT = `"""
PyCalc - Calculadora em Python (Operações Básicas)
Executa apenas as 4 operações básicas: Soma (+), Subtração (-), Multiplicação (*), Divisão (/)
Interface simples e intuitiva feita com Tkinter (biblioteca nativa do Python).

Para executar localmente no seu computador:
    python pycalc.py
"""

import sys
import os

def run_gui():
    import tkinter as tk

    class PyCalcGUI:
        def __init__(self, root: tk.Tk):
            self.root = root
            self.root.title("PyCalc")
            self.root.geometry("340x480")
            self.root.resizable(False, False)
            self.root.configure(bg="#0F172A")

            self.expression = ""
            self.visor_text = tk.StringVar(value="0")

            self._create_widgets()
            self._bind_keys()

        def _create_widgets(self):
            import tkinter as tk

            # Header PyCalc
            header_frame = tk.Frame(self.root, bg="#0F172A")
            header_frame.pack(fill="x", pady=(16, 8), padx=20)

            title_label = tk.Label(
                header_frame,
                text="PyCalc",
                font=("Segoe UI", 20, "bold"),
                bg="#0F172A",
                fg="#38BDF8"
            )
            title_label.pack(side="left")

            subtitle = tk.Label(
                header_frame,
                text="4 Operações Básicas",
                font=("Segoe UI", 9),
                bg="#0F172A",
                fg="#94A3B8"
            )
            subtitle.pack(side="right", pady=(6, 0))

            # Visor
            visor_frame = tk.Frame(
                self.root,
                bg="#1E293B",
                highlightbackground="#334155",
                highlightthickness=1,
                bd=0
            )
            visor_frame.pack(padx=20, pady=8, fill="x")

            self.display = tk.Label(
                visor_frame,
                textvariable=self.visor_text,
                font=("Consolas", 26, "bold"),
                bg="#1E293B",
                fg="#F8FAFC",
                anchor="e",
                padx=16,
                pady=20
            )
            self.display.pack(fill="x")

            # Botões
            btn_frame = tk.Frame(self.root, bg="#0F172A")
            btn_frame.pack(padx=20, pady=(12, 20), fill="both", expand=True)

            for col in range(4):
                btn_frame.columnconfigure(col, weight=1, uniform="col")
            for row in range(5):
                btn_frame.rowconfigure(row, weight=1, uniform="row")

            c_num = "#334155"
            c_num_hover = "#475569"
            c_op = "#0284C7"
            c_op_hover = "#0369A1"
            c_clear = "#DC2626"
            c_clear_hover = "#B91C1C"
            c_equal = "#10B981"
            c_equal_hover = "#059669"
            font_main = ("Segoe UI", 15, "bold")

            # Linha 0: Limpar Visor (C) e Divisão (÷)
            btn_c = tk.Button(
                btn_frame,
                text="C  (Limpar Visor)",
                font=("Segoe UI", 12, "bold"),
                bg=c_clear,
                fg="#FFFFFF",
                activebackground=c_clear_hover,
                activeforeground="#FFFFFF",
                relief="flat",
                bd=0,
                cursor="hand2",
                command=self.clear_visor
            )
            btn_c.grid(row=0, column=0, columnspan=3, sticky="nsew", padx=3, pady=3)

            self._create_btn(btn_frame, "÷", 0, 3, c_op, c_op_hover, "#FFFFFF", font_main, lambda: self.set_operator("/"))

            # Linha 1: 7, 8, 9, ×
            self._create_btn(btn_frame, "7", 1, 0, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("7"))
            self._create_btn(btn_frame, "8", 1, 1, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("8"))
            self._create_btn(btn_frame, "9", 1, 2, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("9"))
            self._create_btn(btn_frame, "×", 1, 3, c_op, c_op_hover, "#FFFFFF", font_main, lambda: self.set_operator("*"))

            # Linha 2: 4, 5, 6, -
            self._create_btn(btn_frame, "4", 2, 0, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("4"))
            self._create_btn(btn_frame, "5", 2, 1, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("5"))
            self._create_btn(btn_frame, "6", 2, 2, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("6"))
            self._create_btn(btn_frame, "-", 2, 3, c_op, c_op_hover, "#FFFFFF", font_main, lambda: self.set_operator("-"))

            # Linha 3: 1, 2, 3, +
            self._create_btn(btn_frame, "1", 3, 0, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("1"))
            self._create_btn(btn_frame, "2", 3, 1, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("2"))
            self._create_btn(btn_frame, "3", 3, 2, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("3"))
            self._create_btn(btn_frame, "+", 3, 3, c_op, c_op_hover, "#FFFFFF", font_main, lambda: self.set_operator("+"))

            # Linha 4: 0, ., =
            btn_zero = tk.Button(
                btn_frame,
                text="0",
                font=font_main,
                bg=c_num,
                fg="#F8FAFC",
                activebackground=c_num_hover,
                activeforeground="#FFFFFF",
                relief="flat",
                bd=0,
                cursor="hand2",
                command=lambda: self.add_digit("0")
            )
            btn_zero.grid(row=4, column=0, columnspan=2, sticky="nsew", padx=3, pady=3)

            self._create_btn(btn_frame, ".", 4, 2, c_num, c_num_hover, "#F8FAFC", font_main, lambda: self.add_digit("."))
            self._create_btn(btn_frame, "=", 4, 3, c_equal, c_equal_hover, "#FFFFFF", font_main, self.calculate)

        def _create_btn(self, parent, text, row, col, bg, active_bg, fg, font_style, cmd):
            import tkinter as tk
            btn = tk.Button(
                parent,
                text=text,
                font=font_style,
                bg=bg,
                fg=fg,
                activebackground=active_bg,
                activeforeground="#FFFFFF",
                relief="flat",
                bd=0,
                cursor="hand2",
                command=cmd
            )
            btn.grid(row=row, column=col, sticky="nsew", padx=3, pady=3)
            return btn

        def _bind_keys(self):
            for digit in "0123456789":
                self.root.bind(digit, lambda e, d=digit: self.add_digit(d))
            self.root.bind("+", lambda e: self.set_operator("+"))
            self.root.bind("-", lambda e: self.set_operator("-"))
            self.root.bind("*", lambda e: self.set_operator("*"))
            self.root.bind("/", lambda e: self.set_operator("/"))
            self.root.bind(".", lambda e: self.add_digit("."))
            self.root.bind(",", lambda e: self.add_digit("."))
            self.root.bind("<Return>", lambda e: self.calculate())
            self.root.bind("=", lambda e: self.calculate())
            self.root.bind("<Escape>", lambda e: self.clear_visor())
            self.root.bind("<BackSpace>", lambda e: self.backspace())

        def add_digit(self, char: str):
            current = self.visor_text.get()
            if current in ("0", "Erro", "Divisão por zero") and char != ".":
                self.expression = char
            else:
                if char == "." and self.expression:
                    last_op = max(
                        self.expression.rfind("+"),
                        self.expression.rfind("-"),
                        self.expression.rfind("*"),
                        self.expression.rfind("/")
                    )
                    segment = self.expression[last_op + 1:]
                    if "." in segment:
                        return
                self.expression += char

            self.visor_text.set(self.expression)

        def set_operator(self, op: str):
            if not self.expression:
                curr = self.visor_text.get()
                if curr not in ("0", "Erro", "Divisão por zero"):
                    self.expression = curr
                else:
                    return

            if self.expression and self.expression[-1] in "+-*/":
                self.expression = self.expression[:-1] + op
            else:
                self.expression += op

            self.visor_text.set(self.expression)

        def calculate(self):
            if not self.expression:
                return
            try:
                allowed = set("0123456789+-*/. ")
                if not all(c in allowed for c in self.expression):
                    raise ValueError("Caractere inválido")

                result = eval(self.expression, {"__builtins__": None}, {})
                if isinstance(result, float) and result.is_integer():
                    result = int(result)

                self.visor_text.set(str(result))
                self.expression = str(result)
            except ZeroDivisionError:
                self.visor_text.set("Divisão por zero")
                self.expression = ""
            except Exception:
                self.visor_text.set("Erro")
                self.expression = ""

        def clear_visor(self):
            self.expression = ""
            self.visor_text.set("0")

        def backspace(self):
            if self.expression:
                self.expression = self.expression[:-1]
                self.visor_text.set(self.expression if self.expression else "0")

    root = tk.Tk()
    app = PyCalcGUI(root)
    root.mainloop()


def run_cli():
    print("=" * 36)
    print("           PyCalc (Python)          ")
    print("  Operações: Soma, Subtração,       ")
    print("  Multiplicação e Divisão           ")
    print("=" * 36)
    print("Comandos: 'c' para limpar, 'sair' para encerrar.\\n")

    visor = "0"
    while True:
        try:
            entrada = input(f"[PyCalc | Visor: {visor}] > ").strip()
            if not entrada:
                continue
            if entrada.lower() in ("sair", "exit", "quit", "q"):
                print("Encerrando PyCalc. Até logo!")
                break
            if entrada.lower() in ("c", "limpar", "clear"):
                visor = "0"
                print("Visor limpo.")
                continue

            allowed = set("0123456789+-*/. ")
            if not all(c in allowed for c in entrada):
                print("Erro: Apenas números e as 4 operações (+, -, *, /) são permitidos.")
                continue

            result = eval(entrada, {"__builtins__": None}, {})
            if isinstance(result, float) and result.is_integer():
                result = int(result)
            visor = str(result)
            print(f"Resultado: {visor}")
        except ZeroDivisionError:
            print("Erro: Divisão por zero!")
            visor = "Divisão por zero"
        except Exception as e:
            print(f"Erro no cálculo: {e}")
            visor = "Erro"


if __name__ == "__main__":
    has_display = bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY") or sys.platform in ("win32", "darwin"))
    if "--cli" in sys.argv or not has_display:
        run_cli()
    else:
        try:
            run_gui()
        except Exception:
            run_cli()
`;

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON_SCRIPT_CONTENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = PYTHON_SCRIPT_CONTENT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_SCRIPT_CONTENT], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pycalc.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Código Python (pycalc.py)</h3>
              <p className="text-xs text-slate-400">Calculadora em Python nativo com Tkinter (GUI) e modo Terminal (CLI)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar pycalc.py
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors ml-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Como executar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-3 text-xs text-slate-300">
          <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Para rodar no seu computador (com Python 3 instalado):</span>
          <code className="bg-slate-800 px-2 py-0.5 rounded text-sky-300 font-mono text-xs select-all">
            python pycalc.py
          </code>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-5 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre">{PYTHON_SCRIPT_CONTENT}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Arquivo pronto para desktop: Windows, macOS e Linux.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
