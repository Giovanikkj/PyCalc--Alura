/**
 * Motor de Cálculo para PyCalc
 * Implementa estritamente as 4 operações básicas (+, -, *, /)
 * com tratamento de precisão decimal e divisão por zero padrão Python.
 */

export type OperationType = '+' | '-' | '*' | '/';

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

export function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Erro';
  }

  // Tratamento de imprecisão de ponto flutuante do JavaScript (ex: 0.1 + 0.2)
  // Arredonda para até 12 casas decimais relevantes
  const rounded = Number(Math.round(Number(value + 'e12')) + 'e-12');
  
  if (Math.abs(rounded) > 1e12 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
    return rounded.toExponential(4);
  }

  return rounded.toString();
}

/**
 * Avalia com segurança uma expressão simples contendo apenas números e os 4 operadores.
 */
export function evaluateExpression(expr: string): { success: boolean; result?: string; error?: string } {
  // Limpa espaços
  const sanitized = expr.replace(/\s+/g, '');
  if (!sanitized) {
    return { success: true, result: '0' };
  }

  // Verifica se termina em operador
  let cleanExpr = sanitized;
  while (cleanExpr.length > 0 && ['+', '-', '*', '/'].includes(cleanExpr.slice(-1))) {
    cleanExpr = cleanExpr.slice(0, -1);
  }

  if (!cleanExpr) {
    return { success: true, result: '0' };
  }

  // Validação estrita: apenas dígitos, ponto e os 4 operadores básicos
  if (!/^[-+]?(\d+(\.\d+)?)([-+*/](\d+(\.\d+)?))*$/.test(cleanExpr)) {
    return { success: false, error: 'Expressão inválida' };
  }

  // Divisão por zero detectada por regex antes da execução
  if (/\/0(?!\.)|\/0\.0+(?![\d])/.test(cleanExpr) || /\/0$/.test(cleanExpr)) {
    return { success: false, error: 'Divisão por zero' };
  }

  try {
    // Avaliação usando Function com escopo fechado sem acesso a globais
    // Como a expressão já passou por regex estrito ^[-+]?(\d+(\.\d+)?)([-+*/](\d+(\.\d+)?))*$
    // é 100% segura contra injeção
    const evalFn = new Function(`return (${cleanExpr})`);
    const val = evalFn();

    if (!Number.isFinite(val)) {
      return { success: false, error: 'Divisão por zero' };
    }

    return {
      success: true,
      result: formatResult(val),
    };
  } catch {
    return { success: false, error: 'Erro de cálculo' };
  }
}

/**
 * Som sutil de clique mecânico gerado via Web Audio API (sem assets externos)
 */
let audioCtx: AudioContext | null = null;

export function playKeySound(type: 'num' | 'op' | 'clear' | 'equal' = 'num'): void {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const now = audioCtx.currentTime;

    if (type === 'num') {
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'op') {
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'clear') {
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'equal') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Ignora erros de áudio caso o browser bloqueie
  }
}
