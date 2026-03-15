/**
 * CONTROLLER: Handles user input, updates Model, and refreshes View
 */
export class TalentScoutController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.bindEvents();
    }

    bindEvents() {
        // Global Actions (Delegated)
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;
            const id = e.target.dataset.id || e.target.closest('[data-id]')?.dataset.id;

            if (action === 'toggle-portal') this.togglePortal();
            if (action === 'toggle-dark-mode') {
                const isDark = this.model.toggleDarkMode();
                this.applyDarkMode(isDark);
            }
            if (action === 'edit-profile') this.editProfile(id);
            if (action === 'delete-profile') this.deleteProfile(id);
            if (action === 'create-profile') this.createProfile();
            if (action === 'add-skill') this.addSkill(id);
            if (action === 'delete-skill') this.deleteSkill(id, e.target.dataset.index);
            if (action === 'delete-candidate') this.deleteCandidate(id);
            if (action === 'import-candidates-trigger') document.getElementById('import-candidates-file').click();
            if (action === 'download-candidate-template') this.downloadCandidateTemplate();
            if (action === 'delete-vacancy') this.deleteVacancy(id);
            if (action === 'view-vacancy') this.viewVacancy(id);
            if (action === 'ai-analysis') this.aiAnalysis(id);
            if (action === 'add-feedback') this.addFeedback(id);
            if (action === 'schedule-interview') this.scheduleInterview(id);
            if (action === 'apply-form') this.view.renderApplyForm(this.model.data.vacancies[id]);
            if (action === 'toggle-vacancy-status') this.toggleVacancyStatus(id);
            if (action === 'start-evaluation') this.startEvaluation();
            if (action === 'finish-evaluation') this.finishEvaluation(id);
            if (action === 'reset-data') this.model.resetData();
            if (action === 'export-data') this.exportData();
            if (action === 'import-data-trigger') document.getElementById('import-data-file').click();
            if (action === 'load-demo') this.loadDemoData();
        });

        // Dark mode (Legacy icon click)
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isDark = this.model.toggleDarkMode();
                this.applyDarkMode(isDark);
            });
        }

        // Sidebar Tabs
        document.getElementById('mainTabs').addEventListener('shown.bs.tab', (e) => {
            this.view.pageTitle.textContent = e.target.textContent.trim();
            const tabId = e.target.id;
            if (tabId === 'dashboard-tab') this.view.renderDashboard(this.model.data);
            if (tabId === 'pipeline-tab') this.view.renderPipeline(this.model.data.candidates);
            if (tabId === 'profiles-tab') this.view.renderProfiles(this.model.data.profiles);
            if (tabId === 'vacancies-tab') this.view.renderVacancies(this.model.data.vacancies, this.model.data.profiles);
            if (tabId === 'candidates-tab') this.view.renderCandidates(this.model.data.candidates);
            if (tabId === 'evaluation-tab') this.view.renderEvaluation(this.model.data);
            if (tabId === 'analytics-tab') {
                this.view.renderAnalytics(this.model.data.profiles);
                this.renderAnalyticsTable();
            }
            if (tabId === 'settings-tab') this.view.renderSettings(this.model.data.settings);
        });

        // Input Actions
        document.addEventListener('input', (e) => {
            const action = e.target.dataset.action;
            if (action === 'update-score') this.updateScore(e.target.dataset.id, e.target.dataset.index, e.target.value);
        });

        // Change Actions
        document.addEventListener('change', (e) => {
            const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
            const id = e.target.dataset.id || e.target.closest('[data-id]')?.dataset.id;

            if (e.target.id === 'import-data-file') this.importData(e.target.files[0]);
            if (e.target.id === 'import-candidates-file') this.importCandidates(e.target.files[0]);
            if (action === 'switch-role') this.switchRole(e.target.value);
            if (action === 'update-profile-name') this.model.updateProfileName(id, e.target.value);
            if (action === 'update-notes') this.model.updateEvaluationNotes(id, e.target.dataset.index, e.target.value);
            if (action === 'update-final-rec') this.model.updateEvaluationFinalRec(id, e.target.value);
            if (action === 'update-thresholds') this.updateThresholds();
            if (e.target.id === 'candidate-search') this.searchCandidates(e.target.value);
            if (e.target.dataset.action === 'select-eval-vacancy') this.handleEvalVacancySelect(e.target.value);
            if (e.target.id === 'analytics-profile-filter') this.renderAnalyticsTable();
            if (e.target.name === 'compare-candidate') this.updateRadarChart();
        });

        // Submit Actions
        const mainContent = document.getElementById('mainTabsContent');
        if (mainContent) {
            mainContent.addEventListener('submit', (e) => {
                if (e.target.id === 'candidate-form') {
                    e.preventDefault();
                    this.addCandidate();
                }
                if (e.target.id === 'vacancy-form') {
                    e.preventDefault();
                    this.addVacancy();
                }
            });
        }
    }

    applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-bs-theme', 'light');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
        }
    }

    // --- Handler methods ---
    editProfile(id) {
        this.view.renderProfileDetails(this.model.data.profiles[id]);
    }

    createProfile() {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        document.getElementById('formModalLabel').innerText = 'Nuevo Perfil Requerido';
        document.getElementById('formModalBody').innerHTML = `<div class="mb-3"><label class="form-label">Nombre del Perfil</label><input type="text" id="new-profile-name" class="form-control" placeholder="Ej: Backend Developer"></div>`;
        document.getElementById('formModalSave').onclick = () => {
            const name = document.getElementById('new-profile-name').value;
            if (name) {
                const id = this.model.addProfile(name);
                this.view.renderProfiles(this.model.data.profiles);
                this.editProfile(id);
                modal.hide();
            }
        };
        modal.show();
    }

    toggleVacancyStatus(id) {
        const vacancy = this.model.data.vacancies[id];
        const newStatus = vacancy.status === 'Abierta' ? 'Cerrada' : 'Abierta';
        this.model.updateVacancyStatus(id, newStatus);
        this.view.renderVacancies(this.model.data.vacancies, this.model.data.profiles);
    }

    togglePortal() {
        const recruiterApp = document.getElementById('recruiter-app');
        const candidatePortal = document.getElementById('candidate-portal');
        const sidebar = document.getElementById('sidebar');

        if (candidatePortal.classList.contains('d-none')) {
            candidatePortal.classList.remove('d-none');
            recruiterApp.classList.add('d-none');
            sidebar.style.display = 'none';
            document.getElementById('main-content').style.marginLeft = '0';
            this.view.renderCandidatePortal(this.model.data.vacancies);
        } else {
            candidatePortal.classList.add('d-none');
            recruiterApp.classList.remove('d-none');
            sidebar.style.display = 'block';
            document.getElementById('main-content').style.marginLeft = 'var(--sidebar-width)';
        }
    }

    switchRole(role) {
        this.model.setRole(role);
        this.view.applyRBAC(role);
        this.view.showToast(`Acceso configurado como: ${role}`, 'info');
        this.view.renderDashboard(this.model.data);
        document.getElementById('dashboard-tab').click();
    }

    submitApplication() {
        const name = document.getElementById('apply-name').value;
        const email = document.getElementById('apply-email').value;
        const portfolio = document.getElementById('apply-portfolio').value;
        const vacancyId = document.getElementById('apply-vacancy-id').value;
        const profileId = document.getElementById('apply-profile-id').value;

        if (name && email && portfolio) {
            const candidateId = this.model.addCandidate({
                name, email, portfolio,
                seniority: 'Prospecto',
                status: 'Prospecto',
                photoUrl: `https://i.pravatar.cc/150?u=${Date.now()}`
            });

            const profile = this.model.data.profiles[profileId];
            this.model.createEvaluation({
                candidateId, profileId, vacancyId,
                status: 'En Progreso', globalScore: 0,
                skills: JSON.parse(JSON.stringify(profile.skills)),
                scores: profile.skills.map(s => ({ name: s.name, score: 0, notes: 'Aplicación recibida vía Portal' }))
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('formModal'));
            if (modal) modal.hide();
            this.view.showToast("¡Aplicación exitosa! El equipo de Talentos revisará tu perfil.", "success");
        }
    }

    viewVacancy(id) {
        const vacancy = this.model.data.vacancies[id];
        const profile = this.model.data.profiles[vacancy.profileId];
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        document.getElementById('formModalLabel').innerText = vacancy.title;
        document.getElementById('formModalBody').innerHTML = `
            <div class="mb-3"><strong>Perfil Requerido:</strong> ${profile?.name || 'N/A'}</div>
            <div class="mb-3"><strong>Nivel Experiencia:</strong> ${vacancy.experience || 'N/A'}</div>
            <div class="mb-3"><strong>Requisitos Técnicos:</strong> ${vacancy.requirements || 'No especificado'}</div>
            <div class="mb-3"><strong>Habilidades Blandas:</strong> ${vacancy.softSkills || 'No especificado'}</div>
            <hr>
            <h6>Multipublicación ATS (Módulos Activos):</h6>
            <div class="d-flex gap-2 mb-3">
                <span class="badge bg-secondary"><i class="bi bi-linkedin"></i> LinkedIn</span>
                <span class="badge bg-secondary"><i class="bi bi-google"></i> Google Jobs</span>
                <span class="badge bg-secondary"><i class="bi bi-facebook"></i> Facebook Jobs</span>
            </div>
            <hr>
            <h6>Matriz de Competencias:</h6>
            <ul class="list-unstyled">${profile?.skills.map(s => `<li><i class="bi bi-check2 text-success me-2"></i>${s.name} (${s.category})</li>`).join('') || '<li>Sin skills definidas</li>'}</ul>
        `;
        const saveBtn = document.getElementById('formModalSave');
        saveBtn.classList.add('d-none');
        modal.show();
        document.getElementById('formModal').addEventListener('hidden.bs.modal', () => {
            saveBtn.classList.remove('d-none');
        }, { once: true });
    }

    deleteProfile(id) {
        const isUsed = Object.values(this.model.data.evaluations).some(e => e.profileId === id);
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        document.getElementById('confirmModalBody').innerText = isUsed ? 'Este perfil tiene evaluaciones asociadas. ¿Realmente desea eliminarlo?' : '¿Confirmar eliminación del perfil?';
        document.getElementById('confirmModalDelete').onclick = () => {
            this.model.deleteProfile(id);
            this.view.renderProfiles(this.model.data.profiles);
            const details = document.getElementById('profile-details');
            if (details) details.innerHTML = '';
            modal.hide();
        };
        modal.show();
    }

    addSkill(profileId) {
        const name = document.getElementById('skill-name').value;
        const category = document.getElementById('skill-category').value;
        const weight = parseInt(document.getElementById('skill-weight').value);
        if (name) {
            this.model.addSkill(profileId, { name, category, weight });
            this.editProfile(profileId);
        }
    }

    deleteSkill(profileId, index) {
        this.model.deleteSkill(profileId, index);
        this.editProfile(profileId);
    }

    addCandidate() {
        const candidate = {
            name: document.getElementById('candidate-name').value,
            seniority: document.getElementById('candidate-seniority').value,
            status: document.getElementById('candidate-status').value,
            email: document.getElementById('candidate-email').value,
            portfolio: document.getElementById('candidate-portfolio').value,
            photoUrl: document.getElementById('candidate-photo').value
        };
        if (candidate.name && candidate.email) {
            this.model.addCandidate(candidate);
            this.view.renderCandidates(this.model.data.candidates);
            this.view.showToast("Candidato registrado exitosamente", "success");
        }
    }

    importCandidates(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            let candidates = [];
            if (file.name.endsWith('.json')) {
                try { candidates = JSON.parse(content); } catch (err) { return this.view.showToast("JSON inválido", "danger"); }
            } else if (file.name.endsWith('.csv')) {
                const lines = content.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                candidates = lines.slice(1).filter(l => l.trim()).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = values[i]);
                    return obj;
                });
            }
            if (candidates.length > 0) {
                this.model.bulkAddCandidates(candidates);
                this.view.renderCandidates(this.model.data.candidates);
                this.view.showToast(`Carga masiva: ${candidates.length} perfiles importados`, "success");
            }
        };
        reader.readAsText(file);
    }

    downloadCandidateTemplate() {
        const csvContent = "data:text/csv;charset=utf-8,name,seniority,email,portfolio,photoUrl\nJuan Demo,Senior,juan@demo.com,https://portfolio.com,https://i.pravatar.cc/150?u=demo";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "talentscout_plantilla.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    deleteCandidate(id) {
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        document.getElementById('confirmModalBody').innerText = '¿Eliminar candidato y todo su historial de evaluaciones?';
        document.getElementById('confirmModalDelete').onclick = () => {
            this.model.deleteCandidate(id);
            this.view.renderCandidates(this.model.data.candidates);
            modal.hide();
        };
        modal.show();
    }

    addVacancy() {
        const vacancy = {
            title: document.getElementById('vacancy-title').value,
            profileId: document.getElementById('vacancy-profile').value,
            experience: document.getElementById('vacancy-experience').value,
            requirements: document.getElementById('vacancy-requirements').value,
            softSkills: document.getElementById('vacancy-softskills').value,
            status: 'Abierta'
        };
        if (vacancy.title && vacancy.profileId) {
            this.model.addVacancy(vacancy);
            this.view.renderVacancies(this.model.data.vacancies, this.model.data.profiles);
            this.view.showToast("Nueva posición abierta en el pipeline", "success");
        }
    }

    deleteVacancy(id) {
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        document.getElementById('confirmModalBody').innerText = '¿Realmente desea cerrar y eliminar esta vacante?';
        document.getElementById('confirmModalDelete').onclick = () => {
            this.model.deleteVacancy(id);
            this.view.renderVacancies(this.model.data.vacancies, this.model.data.profiles);
            modal.hide();
        };
        modal.show();
    }

    searchCandidates(term) {
        const filtered = Object.values(this.model.data.candidates).filter(c =>
            c.name.toLowerCase().includes(term.toLowerCase()) ||
            c.email.toLowerCase().includes(term.toLowerCase())
        );
        document.getElementById('candidate-list').innerHTML = this.view.renderCandidateList(filtered);
    }

    handleEvalVacancySelect(vacancyId) {
        if (!vacancyId) return;
        const vacancy = this.model.data.vacancies[vacancyId];
        if (vacancy && vacancy.profileId) {
            const select = document.getElementById('eval-profile-select');
            if (select) select.value = vacancy.profileId;
        }
    }

    startEvaluation() {
        const vacancyId = document.getElementById('eval-vacancy-select').value || null;
        const profileId = document.getElementById('eval-profile-select').value;
        const candidateId = document.getElementById('eval-candidate-select').value;

        if (!profileId || !candidateId) return this.view.showToast("Seleccione perfil y candidato para continuar", "danger");

        let evaluation = this.model.getEvaluation(profileId, candidateId, vacancyId);
        if (!evaluation) {
            const profile = this.model.data.profiles[profileId];
            evaluation = this.model.createEvaluation({
                candidateId, profileId, vacancyId, status: 'En Progreso', globalScore: 0,
                skills: JSON.parse(JSON.stringify(profile.skills)),
                scores: profile.skills.map(s => ({ name: s.name, score: 5, notes: '' }))
            });
        }
        this.view.renderEvaluationForm(evaluation, this.model.data.candidates[candidateId], this.model.data.profiles[profileId]);
    }

    updateScore(evalId, index, score) {
        this.model.updateEvaluationScore(evalId, index, score);
        const evaluation = this.model.data.evaluations[evalId];
        this.view.updateScoreUI(index, score, evaluation.globalScore);
    }

    scheduleInterview(id) {
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        if (date && time) {
            const info = document.getElementById('scheduled-info');
            if (info) info.classList.remove('d-none');
            this.view.showToast(`Entrevista sincronizada para el ${date} @ ${time}`, 'success');
        }
    }

    // Kanban Handlers
    handleDragStart(e, candidateId) {
        e.dataTransfer.setData('candidateId', candidateId);
    }

    handleDrop(e, stage) {
        const candidateId = e.dataTransfer.getData('candidateId');
        this.model.updateCandidateStatus(candidateId, stage);
        this.view.renderPipeline(this.model.data.candidates);
        this.view.showToast(`Candidato reclasificado: ${stage}`, 'success');
    }

    aiAnalysis(id) {
        this.view.showToast("Procesando CV con IA avanzada...", "info");
        setTimeout(() => {
            this.view.showToast("Análisis completado: Perfil altamente compatible con el Stack.", "success");
        }, 1500);
    }

    addFeedback(id) {
        const reviewer = document.getElementById('feedback-reviewer').value;
        const comment = document.getElementById('feedback-comment').value;
        const rating = parseInt(document.getElementById('feedback-rating').value);

        if (reviewer && comment) {
            this.model.addEvaluationFeedback(id, reviewer, comment, rating);
            const evaluation = this.model.data.evaluations[id];
            this.view.renderEvaluationForm(evaluation, this.model.data.candidates[evaluation.candidateId], this.model.data.profiles[evaluation.profileId]);
            this.view.showToast("Feedback registrado exitosamente", "success");
        }
    }

    finishEvaluation(id) {
        this.model.finishEvaluation(id);
        this.view.showToast("Evaluación finalizada y guardada en historial", "success");
        this.view.renderEvaluation(this.model.data);
    }

    updateThresholds() {
        this.model.updateThresholds(
            parseInt(document.getElementById('threshold-recommended').value),
            parseInt(document.getElementById('threshold-reserved').value)
        );
        this.view.showToast("Nuevos umbrales de decisión aplicados", "success");
    }

    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.model.data));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `talentscout_v4_backup_${new Date().toISOString().slice(0, 10)}.json`);
        anchor.click();
    }

    importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.profiles && imported.candidates) {
                    this.model.data = imported;
                    this.model.saveData();
                    location.reload();
                }
            } catch (err) { this.view.showToast("Error crítico en importación", "danger"); }
        };
        reader.readAsText(file);
    }

    loadDemoData() {
        if (confirm("¿Cargar set de datos de prueba v4.0? Se perderán los cambios actuales.")) {
            this.model.initDefaultData();
            location.reload();
        }
    }

    renderAnalyticsTable() {
        const filter = document.getElementById('analytics-profile-filter').value;
        let evals = Object.entries(this.model.data.evaluations).filter(([id, e]) => e.status === 'Evaluado' && this.model.data.candidates[e.candidateId] && this.model.data.profiles[e.profileId]);
        if (filter !== 'all') evals = evals.filter(([id, e]) => e.profileId === filter);
        evals.sort(([ia, a], [ib, b]) => b.globalScore - a.globalScore);
        this.view.renderAnalyticsTable(evals, this.model.data.candidates, this.model.data.profiles, this.model.data.settings);
    }

    updateRadarChart() {
        const checked = Array.from(document.querySelectorAll('input[name="compare-candidate"]:checked')).map(cb => cb.value);
        if (checked.length < 2 || checked.length > 3) {
            if (this.view.radarChart) { this.view.radarChart.destroy(); this.view.radarChart = null; }
            return;
        }
        const evaluations = checked.map(id => this.model.data.evaluations[id]);
        const profile = this.model.data.profiles[evaluations[0].profileId];
        const labels = profile.skills.map(s => s.name);
        const datasets = evaluations.map((e, i) => {
            const colors = ['rgba(37, 99, 235, 0.2)', 'rgba(239, 68, 68, 0.2)', 'rgba(16, 185, 129, 0.2)'];
            const borders = ['rgb(37, 99, 235)', 'rgb(239, 68, 68)', 'rgb(16, 185, 129)'];
            return { label: this.model.data.candidates[e.candidateId].name, data: e.scores.map(s => s.score), fill: true, backgroundColor: colors[i], borderColor: borders[i], pointBackgroundColor: borders[i] };
        });
        this.view.renderRadarChart(labels, datasets);
    }
}
