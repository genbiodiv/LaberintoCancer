import { jsPDF } from 'jspdf';
import { HALLMARKS_CATALOG } from '../engine/knowledgeBase';
import { SimulationState } from '../engine/types';

export function exportSimulationReportPdf(state: SimulationState): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const ensureSpace = (needed: number) => {
    if (y + needed > 780) {
      doc.addPage();
      y = 52;
    }
  };

  const addHeading = (title: string) => {
    ensureSpace(32);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  };

  const addParagraph = (text: string, boldPrefix?: string) => {
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const fullText = boldPrefix ? `${boldPrefix} ${text}` : text;
    const lines = doc.splitTextToSize(fullText, maxWidth);
    ensureSpace(lines.length * 13 + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, margin, y);
    y += lines.length * 13 + 6;
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('El laberinto del cáncer — Informe de simulación educativa', margin, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Modo: ${state.mode === 'cancer' ? 'Cáncer (Evoluciona y escapa)' : 'Oncólogo (Diagnostica y combate)'}  ·  Progresión bifurcada (${state.history.length} rondas)`,
    margin,
    y
  );
  y += 15;
  const accumulatedSummary =
    state.accumulatedProblems.length > 0
      ? state.accumulatedProblems.map((p) => p.precisionLabel).join(', ')
      : 'Sin alteraciones adicionales acumuladas';
  doc.text(
    `Alteraciones acumuladas: ${accumulatedSummary}  ·  Fecha: ${new Date().toLocaleDateString('es-ES')}`,
    margin,
    y
  );
  y += 18;

  // Outcome & Score
  addHeading('1. Resultado final y evaluación formativa');
  addParagraph(state.outcomeTitle ?? 'Partida completada', 'Desenlace:');
  if (state.outcomeExplanation) {
    addParagraph(state.outcomeExplanation);
  }
  addParagraph(
    `Total ${state.score.total}/100  |  Comprensión molecular: ${state.score.molecularComprehension}/30  |  Relaciones causales: ${state.score.causalRelations}/30  |  Decisiones fundamentadas: ${state.score.groundedDecisions}/25  |  Reflexión: ${state.score.reflection}/15`,
    'Puntuación:'
  );
  addParagraph(
    `Carga tumoral: ${state.clinical.tumorBurden}/100  ·  Extensión: ${state.clinical.diseaseExtent}  ·  Toxicidad acumulada: ${state.clinical.cumulativeToxicity}/100  ·  Calidad de vida: ${state.clinical.qualityOfLife}/100 (escalas internas ficticias con fines docentes).`,
    'Estado clínico simulado:'
  );

  // Clonal evolution
  addHeading('2. Poblaciones clonales finales y Hallmarks afectados');
  state.clones.forEach((clone) => {
    addParagraph(`${clone.name}: ${clone.share}% — ${clone.description}`);
  });

  const topHallmarks = [...HALLMARKS_CATALOG]
    .sort((a, b) => state.hallmarkScores[b.id] - state.hallmarkScores[a.id])
    .slice(0, 5)
    .map((h) => `${h.name} (${state.hallmarkScores[h.id]}/100)`)
    .join(' · ');
  addParagraph(topHallmarks, 'Hallmarks predominantes (Hanahan, Cell 2026):');

  // Turn history
  addHeading('3. Registro de rondas y decisiones');
  state.history.forEach((entry) => {
    addParagraph(
      `Ronda ${entry.roundNumber} (${entry.eventTitle}) — Acción: ${entry.actionTakenLabel}. ${entry.whatHappened} Genes: ${entry.genesInvolved.join(', ')}.`
    );
  });

  // Reflection questions
  addHeading('4. Preguntas de integración del equipo');
  addParagraph(
    state.reflections.q1KeyAlterations.trim() || '(Sin respuesta registrada)',
    'P1. ¿Cuáles fueron las alteraciones o interacciones moleculares más importantes para explicar el resultado?'
  );
  addParagraph(
    state.reflections.q2HallmarksRelation.trim() || '(Sin respuesta registrada)',
    'P2. ¿Cómo se relacionaron las distintas capacidades del cáncer?'
  );
  addParagraph(
    state.reflections.q3AlternativePath.trim() || '(Sin respuesta registrada)',
    'P3. ¿Qué otra intervención o alteración habría cambiado el resultado y por qué?'
  );

  // Evidence footer
  addHeading('5. Fuentes científicas y descargo educativo');
  addParagraph(
    'Hanahan D. Hallmarks of cancer—Then and now, and beyond. Cell. 2026. DOI: 10.1016/j.cell.2025.12.049.'
  );
  addParagraph(
    'COSMIC Cancer Gene Census — Hallmarks of Cancer. Las reglas terapéuticas provienen de principios conceptuales clínicos independientes y no constituyen recomendaciones médicas ni pronósticos reales.'
  );

  const safeTeam = state.teamName.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 24);
  doc.save(`El_laberinto_del_cancer_${state.mode}_${safeTeam || 'Equipo'}.pdf`);
}
