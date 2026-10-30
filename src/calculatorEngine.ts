/**
 * Motor de Cálculo para PyCalc
 * Implementa as 4 operações básicas (+, -, *, /) e cálculo de porcentagem (%)
 * com tratamento de precisão decimal e divisão por zero padrão Python.
 */

export type OperationType = '+' | '-' | '*' | '/' | '%';

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
 * Converte expressões com porcentagem (%) para aritmética padrão de calculadora:
 * 1. Base + Porcentagem: 100 + 20% -> 100 + ((100)*(20)/100) = 120
 * 2. Base - Porcentagem: 200 - 15% -> 200 - ((200)*(15)/100) = 170
 * 3. Multiplicação / Divisão ou número isolado: 200 * 15% -> 200 * ((15)/100) = 30; 50% -> 0.5
 */
export function preprocessPercentage(expr: string): string {
  let clean = expr.replace(/\s+/g, '');
  
  // Trata Base + Taxa% e Base - Taxa%
  clean = clean.replace(/(\d+(?:\.\d+)?)\s*([+-])\s*(\d+(?:\.\d+)?)%/g, (_match, base, op, rate) => {
    return `${base}${op}((${base})*(${rate})/100)`;
  });

  // Trata porcentagens restantes (ex: 50%, 200 * 15%, 50 / 10%)
  clean = clean.replace(/(\d+(?:\.\d+)?)%/g, '(($1)/100)');

  return clean;
}

/**
 * Avalia com segurança uma expressão contendo números, as 4 operações básicas e porcentagem.
 */
export function evaluateExpression(expr: string): { success: boolean; result?: string; error?: string } {
  // Limpa espaços
  const sanitized = expr.replace(/\s+/g, '');
  if (!sanitized) {
    return { success: true, result: '0' };
  }

  // Remove operadores pendentes no final (exceto %)
  let cleanExpr = sanitized;
  while (cleanExpr.length > 0 && ['+', '-', '*', '/'].includes(cleanExpr.slice(-1))) {
    cleanExpr = cleanExpr.slice(0, -1);
  }

  if (!cleanExpr) {
    return { success: true, result: '0' };
  }

  // Pré-processa porcentagem
  const expandedExpr = preprocessPercentage(cleanExpr);

  // Validação estrita: apenas dígitos, ponto, parênteses e operadores básicos
  if (!/^[-+*/.()0-9]+$/.test(expandedExpr)) {
    return { success: false, error: 'Expressão inválida' };
  }

  // Divisão por zero detectada antes da execução
  if (/\/0(?!\.)|\/0\.0+(?![\d])/.test(expandedExpr) || /\/0$/.test(expandedExpr)) {
    return { success: false, error: 'Divisão por zero' };
  }

  try {
    const evalFn = new Function(`return (${expandedExpr})`);
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

export function playKeySound(type: 'num' | 'op' | 'clear' | 'equal' | 'percent' = 'num'): void {
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
    } else if (type === 'op' || type === 'percent') {
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
