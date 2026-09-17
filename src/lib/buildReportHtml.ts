import type { InsightsBundle } from '@/lib/insights';
import type { Profile } from '@/types/database';

const MEDICATION_LABEL: Record<string, string> = {
  ozempic: 'Ozempic',
  mounjaro: 'Mounjaro',
  wegovy: 'Wegovy',
  other: 'Outro',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

/**
 * Builds a standalone, print-friendly HTML document (light background, no
 * dark theme) — meant to be printed to paper or PDF and taken to a medical
 * appointment, not viewed on screen inside the app.
 */
export function buildReportHtml(profile: Profile | null, insights: InsightsBundle) {
  const measurementsRows = insights.raw.measurements
    .slice(-12)
    .map(
      (m) => `
        <tr>
          <td>${formatDate(m.measured_at)}</td>
          <td>${m.weight_kg ?? '—'}</td>
          <td>${m.waist_cm ?? '—'}</td>
          <td>${m.hip_cm ?? '—'}</td>
        </tr>`
    )
    .join('');

  const symptomTimingHtml = insights.symptomTimingInsights.length
    ? `<ul>${insights.symptomTimingInsights.map((text) => `<li>${text}</li>`).join('')}</ul>`
    : '<p class="muted">Ainda não há dados suficientes para identificar um padrão de sintomas após a aplicação.</p>';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório Ozelo</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    padding: 32px 40px;
    line-height: 1.5;
  }
  h1 { font-size: 22px; margin: 0 0 4px; color: #4a2e9e; }
  h2 { font-size: 15px; margin: 28px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
  .meta-grid { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 8px; }
  .meta-item { font-size: 13px; }
  .meta-label { color: #888; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  p { font-size: 13px; margin: 6px 0; }
  ul { margin: 6px 0; padding-left: 20px; font-size: 13px; }
  li { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
  th { color: #888; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em; }
  .muted { color: #888; font-style: italic; }
  .summary-box { background: #f6f3ff; border-radius: 8px; padding: 14px 16px; font-size: 13px; }
  footer { margin-top: 40px; font-size: 11px; color: #999; }
  @media print {
    body { padding: 0 24px; }
  }
</style>
</head>
<body>
  <h1>Relatório Ozelo</h1>
  <p class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${insights.periodLabel}</p>

  <div class="meta-grid">
    <div class="meta-item"><span class="meta-label">Nome</span>${profile?.full_name ?? '—'}</div>
    <div class="meta-item"><span class="meta-label">Medicamento</span>${
      profile?.medication ? MEDICATION_LABEL[profile.medication] ?? profile.medication : '—'
    }</div>
    <div class="meta-item"><span class="meta-label">Peso atual</span>${profile?.current_weight_kg ?? '—'} kg</div>
    <div class="meta-item"><span class="meta-label">Meta de peso</span>${profile?.goal_weight_kg ?? '—'} kg</div>
  </div>

  <h2>Resumo da semana</h2>
  <div class="summary-box">${insights.weeklySummary}</div>

  <h2>Sintomas em relação à aplicação da medicação</h2>
  ${symptomTimingHtml}

  <h2>Hidratação e sintomas</h2>
  <p>${insights.hydrationSymptomInsight ?? '<span class="muted">Ainda não há dados suficientes para essa correlação.</span>'}</p>

  <h2>Progresso e adesão</h2>
  <p>${insights.adherenceProgressInsight ?? '<span class="muted">Ainda não há dados suficientes para essa correlação — registre mais medidas ao longo do tempo.</span>'}</p>

  <h2>Medidas corporais recentes</h2>
  ${
    insights.raw.measurements.length
      ? `<table>
          <thead><tr><th>Data</th><th>Peso (kg)</th><th>Cintura (cm)</th><th>Quadril (cm)</th></tr></thead>
          <tbody>${measurementsRows}</tbody>
        </table>`
      : '<p class="muted">Nenhuma medida registrada ainda.</p>'
  }

  <footer>
    Este relatório foi gerado automaticamente a partir dos registros feitos no app Ozelo e tem caráter
    informativo — não substitui avaliação médica.
  </footer>
</body>
</html>`;
}
