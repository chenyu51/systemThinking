Object.assign(Canvas.prototype, {
  updateSystemConceptPanel() {
    const group = document.getElementById('systemConceptGroup');
    if (!group) return;
    const aiInfo = store.data.aiInfo;
    const concepts = aiInfo?.systemConcepts || {};
    const hasContent = ['feedbackLoops', 'stocks', 'flows', 'variables', 'delays', 'boundaries', 'archetypes']
      .some((key) => Array.isArray(concepts[key]) && concepts[key].length);
    if (!hasContent) {
      group.style.display = 'none';
      return;
    }
    group.style.display = 'block';
    this.fillConceptList('systemFeedbackLoops', concepts.feedbackLoops);
    this.fillConceptList('systemStocks', concepts.stocks);
    this.fillConceptList('systemFlows', concepts.flows);
    this.fillConceptList('systemVariables', concepts.variables);
    this.fillConceptList('systemDelays', concepts.delays);
    this.fillConceptList('systemBoundaries', concepts.boundaries);
    this.fillConceptList('systemArchetypes', concepts.archetypes);
  },

  fillConceptList(id, items = []) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = this.renderInfoList(items);
  }
});
