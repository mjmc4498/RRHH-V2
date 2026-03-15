/**
 * VIEW: UI Rendering and DOM manipulation
 */
export class TalentScoutView {
    constructor() {
        this.mainContent = document.getElementById('mainTabsContent');
        this.pageTitle = document.getElementById('page-title');
        this.statusChart = null;
        this.funnelChart = null;
        this.radarChart = null;
    }

    applyRBAC(role) {
        const elements = {
            'settings-tab': ['Admin'],
            'profiles-tab': ['Admin', 'Recruiter'],
            'vacancies-tab': ['Admin', 'Recruiter'],
            'pipeline-tab': ['Admin', 'Recruiter', 'Interviewer'],
            'candidates-tab': ['Admin', 'Recruiter'],
            'evaluation-tab': ['Admin', 'Recruiter', 'Interviewer'],
            'analytics-tab': ['Admin', 'Recruiter']
        };

        Object.keys(elements).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const parent = el.closest('.nav-item');
                if (elements[id].includes(role)) {
                    parent.classList.remove('d-none');
                } else {
                    parent.classList.add('d-none');
                }
            }
        });
    }

    renderDashboard(data) {
        const container = document.getElementById('dashboard');
        const stats = {
            totalCandidates: Object.keys(data.candidates).length,
            activeProfiles: Object.keys(data.profiles).length,
            evaluations: Object.values(data.evaluations).filter(e => e.status === 'Evaluado').length,
            avgScore: 0
        };

        const evals = Object.values(data.evaluations).filter(e => e.status === 'Evaluado');
        if (evals.length > 0) {
            stats.avgScore = evals.reduce((acc, curr) => acc + curr.globalScore, 0) / evals.length;
        }

        container.innerHTML = `
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card p-3 border-start border-4 border-primary">
                        <h6 class="text-secondary mb-1">Candidatos Totales</h6>
                        <h2 class="fw-bold mb-0">${stats.totalCandidates}</h2>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card p-3 border-start border-4 border-info">
                        <h6 class="text-secondary mb-1">Perfiles Activos</h6>
                        <h2 class="fw-bold mb-0">${stats.activeProfiles}</h2>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card p-3 border-start border-4 border-success">
                        <h6 class="text-secondary mb-1">Entrevistas</h6>
                        <h2 class="fw-bold mb-0">${stats.evaluations}</h2>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card p-3 border-start border-4 border-warning">
                        <h6 class="text-secondary mb-1">Match Promedio</h6>
                        <h2 class="fw-bold mb-0">${(stats.avgScore * 10).toFixed(0)}%</h2>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-md-8">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title mb-4">Embudo de Reclutamiento (Conversion)</h5>
                            <div style="height: 300px;"><canvas id="funnelChart"></canvas></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100">
                        <div class="card-body text-center d-flex flex-column justify-content-center">
                            <h5 class="card-title mb-4">Tiempo Medio Contratación</h5>
                            <h1 class="display-1 fw-bold text-primary mb-0">18</h1>
                            <p class="text-secondary mt-0">días</p>
                            <small class="text-success"><i class="bi bi-arrow-down"></i> 12% vs mes anterior</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title mb-4">Candidatos Recientes</h5>
                            <ul class="list-group list-group-flush">
                                ${Object.values(data.candidates).slice(-5).reverse().map(c => `
                                    <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center px-0">
                                        <div class="d-flex align-items-center">
                                            <img src="${c.photoUrl || 'https://i.pravatar.cc/150?u='+c.id}" class="candidate-photo me-3" alt="">
                                            <div>
                                                <p class="mb-0 fw-bold">${c.name}</p>
                                                <small class="text-secondary">${c.email}</small>
                                            </div>
                                        </div>
                                        <span class="badge bg-primary-subtle text-primary">${c.status || 'Prospecto'}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title mb-4">Distribución por Estado</h5>
                            <div style="height: 300px;"><canvas id="statusChart"></canvas></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderStatusChart(data.candidates);
        this.renderFunnelChart(data.candidates);
    }

    renderPipeline(candidates) {
        const container = document.getElementById('pipeline');
        const stages = ['Prospecto', 'Prefiltrado', 'Entrevistando', 'Evaluación Técnica', 'Oferta', 'Contratado'];

        container.innerHTML = `
            <div class="kanban-board">
                ${stages.map(stage => `
                    <div class="kanban-column" data-stage="${stage}" ondragover="event.preventDefault()" ondrop="window.appController.handleDrop(event, '${stage}')">
                        <div class="kanban-header">
                            <span>${stage}</span>
                            <span class="badge bg-secondary rounded-pill">${Object.values(candidates).filter(c => (c.status || 'Prospecto') === stage).length}</span>
                        </div>
                        <div class="kanban-cards">
                            ${Object.values(candidates).filter(c => (c.status || 'Prospecto') === stage).map(c => `
                                <div class="kanban-card status-${(c.status || 'Prospecto').toLowerCase()}"
                                     draggable="true" ondragstart="window.appController.handleDragStart(event, '${c.id}')">
                                    <div class="d-flex align-items-center mb-2">
                                        <img src="${c.photoUrl || 'https://i.pravatar.cc/150?u='+c.id}" class="candidate-photo me-2" style="width: 32px; height: 32px;">
                                        <span class="fw-bold small">${c.name}</span>
                                    </div>
                                    <div class="small text-secondary mb-1">${c.seniority}</div>
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <small class="text-primary cursor-pointer">Ver perfil</small>
                                        <i class="bi bi-three-dots"></i>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderStatusChart(candidates) {
        const ctx = document.getElementById('statusChart').getContext('2d');
        const statuses = {};
        Object.values(candidates).forEach(c => {
            const s = c.status || 'Prospecto';
            statuses[s] = (statuses[s] || 0) + 1;
        });

        if (this.statusChart) this.statusChart.destroy();

        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statuses),
                datasets: [{
                    data: Object.values(statuses),
                    backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d']
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    renderFunnelChart(candidates) {
        const ctx = document.getElementById('funnelChart').getContext('2d');
        const stages = ['Prospecto', 'Prefiltrado', 'Entrevistando', 'Evaluación Técnica', 'Oferta', 'Contratado'];
        const counts = stages.map(stage => Object.values(candidates).filter(c => (c.status || 'Prospecto') === stage).length);

        let cumulative = 0;
        const funnelData = [];
        for (let i = counts.length - 1; i >= 0; i--) {
            cumulative += counts[i];
            funnelData.unshift(cumulative);
        }

        if (this.funnelChart) this.funnelChart.destroy();

        this.funnelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stages,
                datasets: [{
                    label: 'Candidatos',
                    data: funnelData,
                    backgroundColor: 'rgba(37, 99, 235, 0.6)',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    renderVacancies(vacancies, profiles) {
        const container = document.getElementById('vacancies');
        container.innerHTML = `
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h2 class="card-title">Nueva Vacante</h2>
                            <form id="vacancy-form">
                                <div class="mb-3">
                                    <label for="vacancy-title" class="form-label">Título de la Posición</label>
                                    <input type="text" id="vacancy-title" class="form-control" required placeholder="Ej: Backend Engineer">
                                </div>
                                <div class="mb-3">
                                    <label for="vacancy-profile" class="form-label">Competencias Requeridas (Perfil)</label>
                                    <select id="vacancy-profile" class="form-select" required>
                                        <option value="" selected disabled>Seleccione un perfil...</option>
                                        ${Object.values(profiles).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="vacancy-experience" class="form-label">Nivel de Experiencia</label>
                                    <select id="vacancy-experience" class="form-select">
                                        <option>Junior</option><option>Semi-Senior</option><option>Senior</option><option>Staff / Lead</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="vacancy-requirements" class="form-label">Requisitos Técnicos (Hard Skills)</label>
                                    <textarea id="vacancy-requirements" class="form-control" rows="2" placeholder="Ej: Python, SQL, Docker..."></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="vacancy-softskills" class="form-label">Habilidades Blandas</label>
                                    <textarea id="vacancy-softskills" class="form-control" rows="2" placeholder="Ej: Liderazgo, Comunicación..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 shadow-sm">Crear Vacante Enterprise</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <h2 class="card-title">Vacantes Activas</h2>
                            <div class="table-responsive">
                                <table class="table align-middle table-hover">
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Perfil</th>
                                            <th>Estado</th>
                                            <th>Fecha</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="vacancy-list">
                                        ${this.renderVacancyList(vacancies, profiles)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderVacancyList(vacancies, profiles) {
        return Object.values(vacancies).map(v => `
            <tr>
                <td>
                    <div class="fw-bold">${v.title}</div>
                    <small class="text-secondary">${v.experience || 'N/A'}</small>
                </td>
                <td>
                    <span class="badge bg-info-subtle text-info">${profiles[v.profileId]?.name || 'N/A'}</span>
                </td>
                <td>
                    <span class="badge ${v.status === 'Abierta' ? 'bg-success' : 'bg-secondary'} cursor-pointer"
                          data-action="toggle-vacancy-status" data-id="${v.id}">
                        ${v.status}
                    </span>
                </td>
                <td><small>${v.date}</small></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" data-action="view-vacancy" data-id="${v.id}"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-vacancy" data-id="${v.id}"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderProfiles(profiles) {
        const container = document.getElementById('profiles');
        const profilesArr = Object.values(profiles);

        container.innerHTML = `
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h2 class="card-title">Perfiles de Puesto</h2>
                            <ul class="list-group list-group-flush">
                                ${profilesArr.map(p => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                        ${p.name}
                                        <div>
                                            <button class="btn btn-sm btn-link text-primary" data-action="edit-profile" data-id="${p.id}">✏️</button>
                                            <button class="btn btn-sm btn-link text-danger" data-action="delete-profile" data-id="${p.id}">🗑️</button>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                            <button class="btn btn-primary w-100 mt-3 shadow-sm" data-action="create-profile">Nuevo Perfil</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-8" id="profile-details"></div>
            </div>
        `;
    }

    renderProfileDetails(profile) {
        const container = document.getElementById('profile-details');
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body p-4">
                    <h2 class="card-title">Configuración del Perfil</h2>
                    <div class="mb-4">
                        <label for="profile-name" class="form-label fw-bold">Nombre del Perfil</label>
                        <input type="text" class="form-control" id="profile-name" value="${profile.name}" data-action="update-profile-name" data-id="${profile.id}">
                    </div>
                    <hr>
                    <h5 class="mb-3">Skills Requeridas</h5>
                    <ul class="list-group list-group-flush mb-4" id="skill-list">
                        ${profile.skills.map((skill, index) => `
                            <li class="list-group-item px-0">
                                <div class="row align-items-center">
                                    <div class="col-md-4"><strong>${skill.name}</strong></div>
                                    <div class="col-md-3"><span class="badge bg-secondary-subtle text-secondary">${skill.category}</span></div>
                                    <div class="col-md-3">Peso: <span class="fw-bold text-primary">${skill.weight}</span></div>
                                    <div class="col-md-2 text-end">
                                        <button class="btn btn-sm btn-outline-danger border-0" data-action="delete-skill" data-id="${profile.id}" data-index="${index}"><i class="bi bi-x-lg"></i></button>
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="card bg-light border-0">
                        <div class="card-body">
                            <h6 class="fw-bold mb-3">Añadir Habilidad</h6>
                            <div class="row g-2">
                                <div class="col-md-5"><input type="text" id="skill-name" class="form-control form-control-sm" placeholder="Nombre Habilidad"></div>
                                <div class="col-md-3">
                                    <select id="skill-category" class="form-select form-select-sm">
                                        <option>Hard Skill</option>
                                        <option>Soft Skill</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <select id="skill-weight" class="form-select form-select-sm">
                                        <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
                                    </select>
                                </div>
                                <div class="col-md-2"><button class="btn btn-sm btn-success w-100" data-action="add-skill" data-id="${profile.id}">Añadir</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCandidates(candidates) {
        const container = document.getElementById('candidates');
        container.innerHTML = `
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h2 class="card-title">Nuevo Candidato</h2>
                            <form id="candidate-form">
                                <div class="mb-3">
                                    <label for="candidate-name" class="form-label">Nombre Completo</label>
                                    <input type="text" id="candidate-name" class="form-control" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="candidate-seniority" class="form-label">Seniority</label>
                                        <select id="candidate-seniority" class="form-select">
                                            <option>Junior</option><option>Semi-Senior</option><option>Senior</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="candidate-status" class="form-label">Estado Inicial</label>
                                        <select id="candidate-status" class="form-select">
                                            <option>Prospecto</option><option>Entrevistando</option><option>Contratado</option><option>Rechazado</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3"><label for="candidate-email" class="form-label">Email</label><input type="email" id="candidate-email" class="form-control" required></div>
                                <div class="mb-3"><label for="candidate-portfolio" class="form-label">CV/Portfolio (URL)</label><input type="url" id="candidate-portfolio" class="form-control" required></div>
                                <div class="mb-3"><label for="candidate-photo" class="form-label">URL Foto (Opcional)</label><input type="url" id="candidate-photo" class="form-control" placeholder="https://i.pravatar.cc/150?u=..."></div>
                                <button type="submit" class="btn btn-primary w-100 shadow-sm"><i class="bi bi-person-plus-fill me-2"></i>Añadir Candidato</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h2 class="card-title mb-0">Base de Talento</h2>
                                <div class="btn-group">
                                    <button class="btn btn-outline-primary btn-sm" data-action="import-candidates-trigger">
                                        <i class="bi bi-file-earmark-arrow-up me-1"></i> Importar
                                    </button>
                                    <input type="file" id="import-candidates-file" class="d-none" accept=".json,.csv">
                                    <button class="btn btn-outline-secondary btn-sm" data-action="download-candidate-template" title="Descargar Plantilla CSV">
                                        <i class="bi bi-download"></i>
                                    </button>
                                </div>
                            </div>
                            <input type="text" id="candidate-search" class="form-control mb-4" placeholder="Filtrar por nombre o email...">
                            <ul class="list-group list-group-flush" id="candidate-list">
                                ${this.renderCandidateList(Object.values(candidates))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCandidateList(candidates) {
        return candidates.map(c => {
            let statusClass = 'bg-secondary';
            if (c.status === 'Contratado') statusClass = 'bg-success';
            if (c.status === 'Entrevistando') statusClass = 'bg-primary';
            if (c.status === 'Rechazado') statusClass = 'bg-danger';

            return `
                <li class="list-group-item bg-transparent px-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <img src="${c.photoUrl || 'https://i.pravatar.cc/150?u='+c.id}" class="candidate-photo me-3 shadow-sm" alt="">
                            <div>
                                <h5 class="mb-1 fw-bold">${c.name}</h5>
                                <p class="mb-0 small text-secondary">
                                    <span class="badge ${statusClass} me-2">${c.status || 'Prospecto'}</span>
                                    ${c.seniority} • ${c.email}
                                </p>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-light me-1" data-action="ai-analysis" data-id="${c.id}" title="Análisis IA"><i class="bi bi-robot text-primary"></i></button>
                            <a href="${c.portfolio}" target="_blank" class="btn btn-sm btn-light me-1" title="Ver CV"><i class="bi bi-file-earmark-person"></i></a>
                            <button class="btn btn-sm btn-light text-danger" data-action="delete-candidate" data-id="${c.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </li>
            `;
        }).join('');
    }

    renderEvaluation(data) {
        const container = document.getElementById('evaluation');
        container.innerHTML = `
            <div class="card mt-3">
                <div class="card-body">
                    <h2 class="card-title">Nueva Evaluación</h2>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label for="eval-vacancy-select" class="form-label small fw-bold">VACANTE (OPCIONAL)</label>
                            <select id="eval-vacancy-select" class="form-select" data-action="select-eval-vacancy">
                                <option value="" selected>Sin vacante específica</option>
                                ${Object.values(data.vacancies).map(v => `<option value="${v.id}">${v.title}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="eval-profile-select" class="form-label small fw-bold">PERFIL</label>
                            <select id="eval-profile-select" class="form-select">
                                <option value="" selected disabled>Elija perfil...</option>
                                ${Object.values(data.profiles).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="eval-candidate-select" class="form-label small fw-bold">CANDIDATO</label>
                            <select id="eval-candidate-select" class="form-select">
                                <option value="" selected disabled>Elija candidato...</option>
                                ${Object.values(data.candidates).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button class="btn btn-primary w-100 shadow-sm" data-action="start-evaluation">Iniciar</button>
                        </div>
                    </div>
                    <hr class="my-5">
                    <div id="evaluation-form-container"></div>
                </div>
            </div>
        `;
    }

    renderEvaluationForm(evaluation, candidate, profile) {
        const container = document.getElementById('evaluation-form-container');
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-5">
                <div class="d-flex align-items-center">
                    <img src="${candidate.photoUrl || 'https://i.pravatar.cc/150?u='+candidate.id}" class="candidate-photo me-4 shadow" style="width: 72px; height: 72px;">
                    <div>
                        <h3 class="mb-1 fw-bold">${candidate.name}</h3>
                        <p class="text-secondary mb-0">Evaluando para: <span class="badge bg-light text-dark border">${profile.name}</span></p>
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge bg-primary mb-1">Scoring Inteligente v4.0</span>
                    <div class="h3 mb-0 text-primary fw-bold" id="smart-score-badge">${(evaluation.globalScore * 10).toFixed(0)}% Match</div>
                </div>
            </div>

            <div class="row g-4">
                ${evaluation.skills.map((skill, index) => `
                    <div class="col-md-6">
                        <div class="card h-100 border-light shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-3">
                                    <h6 class="fw-bold mb-0">${skill.name}</h6>
                                    <span class="badge bg-secondary-subtle text-secondary">Peso: ${skill.weight}</span>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label d-flex justify-content-between small">
                                        <span>Calificación</span><span class="fw-bold text-primary" id="score-val-${index}">${evaluation.scores[index].score}</span>
                                    </label>
                                    <input type="range" class="form-range" min="1" max="10" id="score-${index}" value="${evaluation.scores[index].score}" data-action="update-score" data-id="${evaluation.id}" data-index="${index}">
                                </div>
                                <div>
                                    <textarea class="form-control form-control-sm" rows="2" placeholder="Notas de la skill..." data-action="update-notes" data-id="${evaluation.id}" data-index="${index}">${evaluation.scores[index].notes}</textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="row mt-5">
                <div class="col-md-7">
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <h5 class="card-title d-flex justify-content-between">Agendar Entrevista <i class="bi bi-calendar3 text-primary"></i></h5>
                            <div class="row g-2">
                                <div class="col-md-6"><input type="date" id="schedule-date" class="form-control"></div>
                                <div class="col-md-4"><input type="time" id="schedule-time" class="form-control"></div>
                                <div class="col-md-2"><button class="btn btn-primary w-100" data-action="schedule-interview"><i class="bi bi-plus-lg"></i></button></div>
                            </div>
                            <div id="scheduled-info" class="mt-3 small text-success d-none">
                                <i class="bi bi-check-circle-fill"></i> Sincronizado exitosamente con Google Calendar
                            </div>
                        </div>
                    </div>
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-success">Decisión Final y Recomendación</h5>
                            <textarea class="form-control" id="final-recommendation" rows="5" placeholder="Escriba sus conclusiones aquí..." data-action="update-final-rec" data-id="${evaluation.id}">${evaluation.finalRecommendation || ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title d-flex justify-content-between">Feedback Colaborativo <i class="bi bi-people text-info"></i></h5>
                            <div id="feedback-list" class="mb-4 small overflow-auto" style="max-height: 250px;">
                                ${(evaluation.feedback || []).map(f => `
                                    <div class="border-bottom pb-3 mb-3">
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <strong>${f.reviewer}</strong>
                                            <span class="badge bg-warning text-dark">${f.rating}/5</span>
                                        </div>
                                        <div class="text-secondary">${f.comment}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="bg-light p-3 rounded">
                                <div class="input-group input-group-sm mb-2">
                                    <input type="text" id="feedback-reviewer" class="form-control" placeholder="Nombre Evaluador">
                                    <select id="feedback-rating" class="form-select" style="max-width: 80px;"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
                                </div>
                                <textarea id="feedback-comment" class="form-control form-control-sm mb-2" placeholder="Comentario rápido..."></textarea>
                                <button class="btn btn-sm btn-info text-white w-100 shadow-sm" data-action="add-feedback" data-id="${evaluation.id}">Guardar Feedback</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-5 text-center">
                <button class="btn btn-success btn-lg px-5 shadow" data-action="finish-evaluation" data-id="${evaluation.id}"><i class="bi bi-check2-circle me-2"></i>Finalizar y Registrar Evaluación</button>
            </div>
        `;
    }

    renderAnalytics(profiles) {
        const container = document.getElementById('analytics');
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h2 class="card-title mb-0">Ranking Comparativo de Talento</h2>
                                <select id="analytics-profile-filter" class="form-select w-auto">
                                    <option value="all">Todos los Perfiles</option>
                                    ${Object.values(profiles).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                                </select>
                            </div>
                            <div id="analytics-table-container"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h2 class="card-title">Análisis de Competencias (Spider Chart)</h2>
                            <div id="analytics-chart-container" style="height: 500px;"><canvas id="radarChart"></canvas></div>
                            <div class="alert alert-info mt-4">
                                <i class="bi bi-info-circle-fill me-2"></i> Seleccione 2 o 3 candidatos en la tabla superior para visualizar la comparación de habilidades en tiempo real.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAnalyticsTable(evaluations, candidates, profiles, settings) {
        const container = document.getElementById('analytics-table-container');
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead><tr><th></th><th>Candidato</th><th>Perfil</th><th>Score Match</th><th>Feedback Recomendación</th></tr></thead>
                    <tbody>
                        ${evaluations.map(([id, e]) => {
                            const candidate = candidates[e.candidateId];
                            const profile = profiles[e.profileId];
                            const scorePercentage = e.globalScore * 10;
                            let feedback = '', feedbackClass = '';
                            if (scorePercentage >= settings.thresholds.recommended) { feedback = 'Contratación Recomendada'; feedbackClass = 'bg-success'; }
                            else if (scorePercentage >= settings.thresholds.reserved) { feedback = 'Considerar con Reservas'; feedbackClass = 'bg-warning text-dark'; }
                            else { feedback = 'No cumple perfil'; feedbackClass = 'bg-danger'; }
                            return `
                                <tr>
                                    <td><input type="checkbox" class="form-check-input shadow-none" name="compare-candidate" value="${id}"></td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <img src="${candidate.photoUrl || 'https://i.pravatar.cc/150?u='+candidate.id}" class="candidate-photo me-3" style="width: 32px; height: 32px;">
                                            <strong>${candidate.name}</strong>
                                        </div>
                                    </td>
                                    <td>${profile.name}</td>
                                    <td><div class="progress" style="height: 10px; width: 100px;"><div class="progress-bar" role="progressbar" style="width: ${scorePercentage}%"></div></div> <small>${scorePercentage.toFixed(1)}%</small></td>
                                    <td><span class="badge ${feedbackClass}">${feedback}</span></td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderRadarChart(labels, datasets) {
        const ctx = document.getElementById('radarChart').getContext('2d');
        if (this.radarChart) this.radarChart.destroy();
        this.radarChart = new Chart(ctx, {
            type: 'radar',
            data: { labels, datasets },
            options: {
                maintainAspectRatio: false,
                elements: { line: { borderWidth: 3 } },
                scales: { r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: 10 } }
            }
        });
    }

    renderSettings(settings) {
        const container = document.getElementById('settings');
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body p-4">
                    <h2 class="card-title">Configuración del Sistema</h2>
                    <div class="row g-5">
                        <div class="col-md-6">
                            <h5 class="mb-4">Umbrales de Decisión (%)</h5>
                            <div class="mb-3">
                                <label for="threshold-recommended" class="form-label">Contratación Altamente Recomendada</label>
                                <input type="number" id="threshold-recommended" class="form-control" value="${settings.thresholds.recommended}" data-action="update-thresholds">
                            </div>
                            <div class="mb-3">
                                <label for="threshold-reserved" class="form-label">Considerar con Reservas</label>
                                <input type="number" id="threshold-reserved" class="form-control" value="${settings.thresholds.reserved}" data-action="update-thresholds">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5 class="mb-4">Portabilidad de Datos</h5>
                            <div class="d-grid gap-2 mb-4">
                                <button class="btn btn-outline-primary" data-action="export-data"><i class="bi bi-download me-2"></i>Exportar Backup Completo (JSON)</button>
                                <button class="btn btn-outline-secondary" data-action="import-data-trigger"><i class="bi bi-upload me-2"></i>Importar Backup del Sistema</button>
                                <input type="file" id="import-data-file" class="d-none" accept=".json">
                                <button class="btn btn-outline-info" data-action="load-demo"><i class="bi bi-database-fill-add me-2"></i>Reiniciar con Datos Demo</button>
                            </div>
                            <h5 class="text-danger mb-4">Zona de Peligro</h5>
                            <button class="btn btn-danger w-100 shadow-sm" data-action="reset-data"><i class="bi bi-trash3 me-2"></i>Borrar Base de Datos Local</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showToast(message, type = 'primary') {
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toastMessage');
        const toastHeaderIcon = toastEl.querySelector('.toast-header i');

        toastBody.textContent = message;
        toastHeaderIcon.className = `bi me-2 text-${type}`;
        if (type === 'success') toastHeaderIcon.classList.add('bi-check-circle-fill');
        else if (type === 'danger') toastHeaderIcon.classList.add('bi-exclamation-circle-fill');
        else toastHeaderIcon.classList.add('bi-info-circle-fill');

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    renderCandidatePortal(vacancies) {
        const portal = document.getElementById('candidate-portal');
        portal.innerHTML = `
            <div class="portal-header text-center mb-5">
                <h1 class="display-3 fw-bold mb-3">Tu futuro profesional comienza aquí</h1>
                <p class="lead mb-4">Forma parte de la empresa tecnológica líder. Explora nuestras oportunidades.</p>
                <button class="btn btn-light btn-lg rounded-pill px-5 shadow" data-action="toggle-portal">Modo Reclutador</button>
            </div>
            <div class="container pb-5">
                <div class="row g-4">
                    ${Object.values(vacancies).filter(v => v.status === 'Abierta').map(v => `
                        <div class="col-md-6">
                            <div class="card h-100 border-0 shadow card-hover">
                                <div class="card-body p-5">
                                    <div class="d-flex justify-content-between align-items-start mb-4">
                                        <div>
                                            <h2 class="fw-bold mb-1">${v.title}</h2>
                                            <span class="badge bg-primary-subtle text-primary rounded-pill px-3">${v.experience}</span>
                                        </div>
                                        <i class="bi bi-lightning-charge text-warning fs-1"></i>
                                    </div>
                                    <div class="mb-4">
                                        <h6 class="fw-bold text-uppercase small text-secondary">Requisitos</h6>
                                        <p class="text-muted">${v.requirements || 'Experiencia en el área tecnológica.'}</p>
                                    </div>
                                    <div class="d-grid mt-auto">
                                        <button class="btn btn-primary btn-lg rounded-pill shadow-sm" data-action="apply-form" data-id="${v.id}">Enviar mi CV</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderApplyForm(vacancy) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        document.getElementById('formModalLabel').innerText = `Aplicando a: ${vacancy.title}`;
        document.getElementById('formModalBody').innerHTML = `
            <form id="portal-apply-form" class="p-2">
                <div class="mb-3">
                    <label class="form-label fw-bold">Nombre Completo</label>
                    <input type="text" id="apply-name" class="form-control form-control-lg" placeholder="Juan Pérez" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Correo Electrónico</label>
                    <input type="email" id="apply-email" class="form-control form-control-lg" placeholder="juan@ejemplo.com" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">CV / LinkedIn URL</label>
                    <input type="url" id="apply-portfolio" class="form-control form-control-lg" required placeholder="https://linkedin.com/in/...">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Mensaje / Motivación</label>
                    <textarea id="apply-notes" class="form-control" rows="4" placeholder="¿Por qué quieres unirte?"></textarea>
                </div>
                <input type="hidden" id="apply-vacancy-id" value="${vacancy.id}">
                <input type="hidden" id="apply-profile-id" value="${vacancy.profileId}">
            </form>
        `;
        document.getElementById('formModalSave').innerText = 'Confirmar Aplicación';
        document.getElementById('formModalSave').className = 'btn btn-primary btn-lg w-100 rounded-pill';
        document.getElementById('formModalSave').onclick = () => window.appController.submitApplication();
        modal.show();
    }

    updateScoreUI(index, score, globalScore) {
        const scoreVal = document.getElementById(`score-val-${index}`);
        if (scoreVal) scoreVal.textContent = score;
        const badge = document.getElementById('smart-score-badge');
        if (badge) badge.textContent = `${(globalScore * 10).toFixed(0)}% Match`;
        const globalScoreEl = document.getElementById('global-score');
        if (globalScoreEl) globalScoreEl.textContent = globalScore.toFixed(2);
    }
}
