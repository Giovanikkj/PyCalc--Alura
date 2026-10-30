import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Code, History, RotateCcw, Copy, Check, Percent } from 'lucide-react';
import { evaluateExpression, playKeySound } from './calculatorEngine.ts';
import { PythonCodeModal } from './PythonCodeModal.tsx';

interface HistoryRecord {
  id: string;
  expression: string;
  result: string;
}

export default function App() {
  const [expression, setExpression] = useState<string>('');
  const [visorValue, setVisorValue] = useState<string>('0');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const visorRef = useRef<HTMLDivElement>(null);

  // Manipulação de dígitos (0 a 9 e ponto)
  const handleDigit = useCallback((digit: string) => {
    if (soundEnabled) playKeySound('num');

    setVisorValue((prevVisor) => {
      // Se estava mostrando erro ou zero inicial
      if (prevVisor === '0' || prevVisor === 'Erro' || prevVisor.includes('Divisão')) {
        if (digit === '.') {
          setExpression('0.');
          return '0.';
        }
        setExpression(digit);
        return digit;
      }

      // Se o último caractere era %, adicionar número deve começar uma nova operação ou adicionar
      if (prevVisor.endsWith('%')) {
        const nextVal = prevVisor + '×' + digit;
        setExpression(nextVal);
        return nextVal;
      }

      // Evita múltiplos pontos no mesmo número
      if (digit === '.') {
        const lastOpIndex = Math.max(
          prevVisor.lastIndexOf('+'),
          prevVisor.lastIndexOf('-'),
          prevVisor.lastIndexOf('×'),
          prevVisor.lastIndexOf('÷')
        );
        const currentSegment = prevVisor.substring(lastOpIndex + 1);
        if (currentSegment.includes('.')) {
          return prevVisor;
        }
      }

      const nextVal = prevVisor + digit;
      setExpression(nextVal);
      return nextVal;
    });
  }, [soundEnabled]);

  // Manipulação das 4 operações básicas (+, -, ×, ÷)
  const handleOperator = useCallback((opSymbol: string) => {
    if (soundEnabled) playKeySound('op');

    setVisorValue((prevVisor) => {
      if (prevVisor === 'Erro' || prevVisor.includes('Divisão')) {
        return '0';
      }

      // Se o último caractere já for um operador, substitui pelo novo
      const lastChar = prevVisor.slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        const updated = prevVisor.slice(0, -1) + opSymbol;
        setExpression(updated);
        return updated;
      }

      const updated = prevVisor + opSymbol;
      setExpression(updated);
      return updated;
    });
  }, [soundEnabled]);

  // Manipulação de Porcentagem (%)
  const handlePercentage = useCallback(() => {
    if (soundEnabled) playKeySound('percent');

    setVisorValue((prevVisor) => {
      if (!prevVisor || prevVisor === '0' || prevVisor === 'Erro' || prevVisor.includes('Divisão')) {
        return '0';
      }

      const lastChar = prevVisor.slice(-1);
      // Evita dois %% seguidos ou % logo após operadores
      if (lastChar === '%' || ['+', '-', '×', '÷'].includes(lastChar)) {
        return prevVisor;
      }

      const updated = prevVisor + '%';
      setExpression(updated);
      return updated;
    });
  }, [soundEnabled]);

  // Execução do cálculo (=)
  const handleCalculate = useCallback(() => {
    if (soundEnabled) playKeySound('equal');

    setVisorValue((prevVisor) => {
      if (!prevVisor || prevVisor === '0' || prevVisor === 'Erro' || prevVisor.includes('Divisão')) {
        return prevVisor;
      }

      // Converte símbolos visuais para operadores matemáticos
      const mathExpr = prevVisor.replace(/×/g, '*').replace(/÷/g, '/');
      const evalResult = evaluateExpression(mathExpr);

      if (evalResult.success && evalResult.result !== undefined) {
        // Registra no histórico
        setHistory((prev) => [
          {
            id: Date.now().toString(),
            expression: prevVisor,
            result: evalResult.result!,
          },
          ...prev.slice(0, 19),
        ]);
        setExpression(evalResult.result);
        return evalResult.result;
      } else {
        const errMsg = evalResult.error === 'Divisão por zero' ? 'Divisão por zero' : 'Erro';
        setExpression('');
        return errMsg;
      }
    });
  }, [soundEnabled]);

  // Limpar visor (C)
  const handleClear = useCallback(() => {
    if (soundEnabled) playKeySound('clear');
    setExpression('');
    setVisorValue('0');
  }, [soundEnabled]);

  // Apagar último dígito (Backspace)
  const handleBackspace = useCallback(() => {
    if (soundEnabled) playKeySound('num');
    setVisorValue((prev) => {
      if (prev === '0' || prev === 'Erro' || prev.includes('Divisão') || prev.length <= 1) {
        setExpression('');
        return '0';
      }
      const updated = prev.slice(0, -1);
      setExpression(updated);
      return updated;
    });
  }, [soundEnabled]);

  // Copiar valor do visor
  const handleCopyVisor = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(visorValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }, [visorValue]);

  // Suporte a teclado físico (números, operadores, porcentagem, enter, esc, backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Não intercepta se o modal estiver aberto
      if (isModalOpen) {
        if (e.key === 'Escape') setIsModalOpen(false);
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setActiveKey(e.key);
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        setActiveKey('.');
        handleDigit('.');
      } else if (e.key === '%') {
        e.preventDefault();
        setActiveKey('%');
        handlePercentage();
      } else if (e.key === '+') {
        e.preventDefault();
        setActiveKey('+');
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        setActiveKey('-');
        handleOperator('-');
      } else if (e.key === '*' || e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setActiveKey('×');
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        setActiveKey('÷');
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        setActiveKey('=');
        handleCalculate();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setActiveKey('C');
        handleClear();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }

      setTimeout(() => setActiveKey(null), 150);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleOperator, handlePercentage, handleCalculate, handleClear, handleBackspace, isModalOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500/30">
      {/* Barra Superior Simples e Limpa */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 text-sm">
            Py
          </div>
          <span className="text-xl font-bold tracking-tight text-white">PyCalc</span>
          <span className="hidden sm:inline-block text-xs text-slate-400 ml-2">
            4 Operações Básicas & Porcentagem
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Som */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar som dos cliques' : 'Ativar som dos cliques'}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Botão Histórico */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="Histórico de Cálculos"
            className={`p-2 rounded-lg transition-colors ${
              showHistory
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Botão para ver o Código Python */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/80 hover:bg-sky-900/60 border border-sky-700/50 rounded-lg transition-colors ml-1 shadow-sm"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Código Python (.py)</span>
          </button>
        </div>
      </header>

      {/* Área Central / Corpo da Calculadora */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm flex flex-col gap-4">
          
          {/* Painel Histórico (recolhível) */}
          {showHistory && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400 font-medium">
                <span>Histórico recente</span>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="hover:text-rose-400 text-[11px] transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">Nenhum cálculo registrado ainda.</p>
              ) : (
                <div className="flex flex-col gap-1.5 font-mono text-xs">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setVisorValue(item.result);
                        setExpression(item.result);
                      }}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800 text-left transition-colors group"
                    >
                      <span className="text-slate-400 group-hover:text-slate-200">{item.expression} =</span>
                      <span className="font-semibold text-sky-300">{item.result}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Card Principal da PyCalc */}
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 backdrop-blur-md">
            
            {/* Header da Calculadora */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  PyCalc
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  Python 3
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>+</span>
                <span>−</span>
                <span>×</span>
                <span>÷</span>
                <span>%</span>
              </div>
            </div>

            {/* Visor da Calculadora */}
            <div
              ref={visorRef}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-end min-h-[96px] relative group transition-colors"
            >
              {/* Botão Copiar no Visor */}
              <button
                onClick={handleCopyVisor}
                title="Copiar resultado"
                className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors opacity-80 group-hover:opacity-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Botão Apagar Dígito individual */}
              <button
                onClick={handleBackspace}
                title="Apagar último caractere"
                className="absolute top-2 left-2 p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors opacity-80 group-hover:opacity-100 text-[10px] font-mono"
              >
                ⌫
              </button>

              {/* Expressão / Sub-linha */}
              <div className="text-xs text-slate-400 font-mono text-right truncate h-4 mb-1">
                {expression && expression !== visorValue ? expression : ''}
              </div>

              {/* Valor Principal no Visor */}
              <div
                className={`font-mono-numbers text-right text-3xl sm:text-4xl font-bold tracking-tight select-all truncate ${
                  visorValue.includes('Divisão') || visorValue === 'Erro'
                    ? 'text-rose-400 text-xl'
                    : 'text-white'
                }`}
              >
                {visorValue}
              </div>
            </div>

            {/* Teclado da Calculadora: Números, 4 Operações, Porcentagem e Botão Limpar */}
            <div className="grid grid-cols-4 gap-2.5">
              
              {/* Linha 1: Limpar Visor (C), Porcentagem (%) e Divisão (÷) */}
              <button
                onClick={handleClear}
                className={`col-span-2 py-3.5 px-3 rounded-xl font-semibold text-sm transition-all duration-100 flex items-center justify-center gap-1.5 select-none shadow-sm active:scale-[0.98] ${
                  activeKey === 'C'
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-600/90 hover:bg-rose-600 text-white'
                }`}
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Limpar (C)</span>
              </button>

              <button
                onClick={handlePercentage}
                className={`py-3.5 rounded-xl font-bold text-xl transition-all duration-100 select-none shadow-sm active:scale-[0.98] ${
                  activeKey === '%'
                    ? 'bg-slate-600 text-sky-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/60'
                }`}
                title="Porcentagem"
              >
                %
              </button>

              <button
                onClick={() => handleOperator('÷')}
                className={`py-3.5 rounded-xl font-bold text-xl transition-all duration-100 select-none shadow-sm active:scale-[0.98] ${
                  activeKey === '÷'
                    ? 'bg-sky-400 text-slate-950'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                ÷
              </button>

              {/* Linha 2: 7, 8, 9, × */}
              <button
                onClick={() => handleDigit('7')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '7'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                7
              </button>
              <button
                onClick={() => handleDigit('8')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '8'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                8
              </button>
              <button
                onClick={() => handleDigit('9')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '9'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                9
              </button>
              <button
                onClick={() => handleOperator('×')}
                className={`py-3.5 rounded-xl font-bold text-xl transition-all duration-100 select-none shadow-sm active:scale-[0.98] ${
                  activeKey === '×'
                    ? 'bg-sky-400 text-slate-950'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                ×
              </button>

              {/* Linha 3: 4, 5, 6, - */}
              <button
                onClick={() => handleDigit('4')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '4'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                4
              </button>
              <button
                onClick={() => handleDigit('5')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '5'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                5
              </button>
              <button
                onClick={() => handleDigit('6')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '6'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                6
              </button>
              <button
                onClick={() => handleOperator('-')}
                className={`py-3.5 rounded-xl font-bold text-xl transition-all duration-100 select-none shadow-sm active:scale-[0.98] ${
                  activeKey === '-'
                    ? 'bg-sky-400 text-slate-950'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                −
              </button>

              {/* Linha 4: 1, 2, 3, + */}
              <button
                onClick={() => handleDigit('1')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '1'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                1
              </button>
              <button
                onClick={() => handleDigit('2')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '2'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                2
              </button>
              <button
                onClick={() => handleDigit('3')}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '3'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                3
              </button>
              <button
                onClick={() => handleOperator('+')}
                className={`py-3.5 rounded-xl font-bold text-xl transition-all duration-100 select-none shadow-sm active:scale-[0.98] ${
                  activeKey === '+'
                    ? 'bg-sky-400 text-slate-950'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                +
              </button>

              {/* Linha 5: 0 (duplo), ., = */}
              <button
                onClick={() => handleDigit('0')}
                className={`col-span-2 py-3.5 rounded-xl font-semibold text-lg transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '0'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                0
              </button>
              <button
                onClick={() => handleDigit('.')}
                className={`py-3.5 rounded-xl font-bold text-xl transition-all duration-100 select-none active:scale-[0.98] ${
                  activeKey === '.'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700/50'
                }`}
              >
                .
              </button>
              <button
                onClick={handleCalculate}
                className={`py-3.5 rounded-xl font-bold text-xl transition-all duration-100 select-none shadow-md active:scale-[0.98] ${
                  activeKey === '='
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                =
              </button>
            </div>

            {/* Dica de Atalhos de Teclado */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Teclado numérico ativo</span>
              <div className="flex items-center gap-1.5 font-mono">
                <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Enter</kbd>
                <span>=</span>
                <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">%</kbd>
                <span>%</span>
                <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Esc</kbd>
                <span>Limpar</span>
              </div>
            </div>

          </div>

          {/* Banner Rápido de Ajuda Python */}
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <span className="truncate pr-2">Quer rodar no seu computador em Python?</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sky-400 hover:text-sky-300 font-medium whitespace-nowrap"
            >
              Ver script pycalc.py →
            </button>
          </div>

        </div>
      </main>

      {/* Rodapé Simples e Discreto */}
      <footer className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
        <span>PyCalc · Operações Básicas & Porcentagem</span>
        <span>Soma · Subtração · Multiplicação · Divisão · %</span>
      </footer>

      {/* Modal do Código Python */}
      <PythonCodeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
