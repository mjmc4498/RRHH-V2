/**
 * MODEL: Data management and business logic
 */
export class TalentScoutModel {
    constructor() {
        this.data = {
            profiles: {},
            candidates: {},
            vacancies: {},
            settings: {
                darkMode: false,
                role: 'Admin',
                thresholds: {
                    recommended: 80,
                    reserved: 60
                }
            },
            evaluations: {}
        };
        this.loadData();
    }

    loadData() {
        const data = localStorage.getItem('talentScoutData');
        if (data) {
            const parsed = JSON.parse(data);
            // Migration for dark mode setting
            if (parsed.settings && parsed.settings.darkMode === undefined) {
                parsed.settings.darkMode = false;
            }
            if (!parsed.vacancies) {
                parsed.vacancies = {};
            }
            this.data = parsed;
        } else {
            this.initDefaultData();
        }
    }

    saveData() {
        localStorage.setItem('talentScoutData', JSON.stringify(this.data));
    }

    initDefaultData() {
        this.data.profiles = {
            '1': { id: '1', name: 'Desarrollador Full Stack', skills: [
                { name: 'React', category: 'Hard Skill', weight: 5 },
                { name: 'Node.js', category: 'Hard Skill', weight: 5 },
                { name: 'Inglés', category: 'Soft Skill', weight: 3 },
                { name: 'Comunicación', category: 'Soft Skill', weight: 4 }
            ]},
            '2': { id: '2', name: 'Product Manager', skills: [
                { name: 'Agile', category: 'Hard Skill', weight: 5 },
                { name: 'Roadmapping', category: 'Hard Skill', weight: 4 },
                { name: 'Liderazgo', category: 'Soft Skill', weight: 5 },
                { name: 'Empatía', category: 'Soft Skill', weight: 4 }
            ]}
        };
        this.data.candidates = {
            '1': { id: '1', name: 'Juan Perez', seniority: 'Senior', email: 'juan.perez@example.com', portfolio: 'https://example.com', status: 'Entrevistando', photoUrl: 'https://i.pravatar.cc/150?u=1' },
            '2': { id: '2', name: 'Maria Garcia', seniority: 'Semi-Senior', email: 'maria.garcia@example.com', portfolio: 'https://example.com', status: 'Contratado', photoUrl: 'https://i.pravatar.cc/150?u=2' },
            '3': { id: '3', name: 'Carlos Ruiz', seniority: 'Junior', email: 'carlos.ruiz@example.com', portfolio: 'https://example.com', status: 'Prospecto', photoUrl: 'https://i.pravatar.cc/150?u=3' }
        };
        this.data.vacancies = {
            '1': { id: '1', title: 'Desarrollador Senior React', profileId: '1', status: 'Abierta', date: '2024-05-20' }
        };
        this.data.evaluations = {
            '1': {
                id: '1',
                candidateId: '1',
                profileId: '1',
                vacancyId: '1',
                status: 'Evaluado',
                skills: [
                    { name: 'React', category: 'Hard Skill', weight: 5 },
                    { name: 'Node.js', category: 'Hard Skill', weight: 5 },
                    { name: 'Inglés', category: 'Soft Skill', weight: 3 },
                    { name: 'Comunicación', category: 'Soft Skill', weight: 4 }
                ],
                scores: [
                    { name: 'React', score: 9, notes: 'Excelente dominio' },
                    { name: 'Node.js', score: 8, notes: 'Muy bueno' },
                    { name: 'Inglés', score: 7, notes: 'Bueno' },
                    { name: 'Comunicación', score: 8, notes: 'Claro y conciso' }
                ],
                globalScore: 8.12,
                finalRecommendation: 'Excelente candidato técnico con buenas habilidades de comunicación.',
                feedback: []
            }
        };
        this.saveData();
    }

    // Logic methods moved from TalentScoutApp
    updateThresholds(recommended, reserved) {
        this.data.settings.thresholds.recommended = recommended;
        this.data.settings.thresholds.reserved = reserved;
        this.saveData();
    }

    toggleDarkMode() {
        this.data.settings.darkMode = !this.data.settings.darkMode;
        this.saveData();
        return this.data.settings.darkMode;
    }

    setRole(role) {
        this.data.settings.role = role;
        this.saveData();
    }

    addProfile(name) {
        const id = Date.now().toString();
        this.data.profiles[id] = { id, name, skills: [] };
        this.saveData();
        return id;
    }

    bulkAddCandidates(candidates) {
        candidates.forEach(c => {
            const id = (Date.now() + Math.random()).toString();
            this.data.candidates[id] = { ...c, id, status: c.status || 'Prospecto' };
        });
        this.saveData();
    }

    updateProfileName(id, name) {
        if (this.data.profiles[id]) {
            this.data.profiles[id].name = name;
            this.saveData();
        }
    }

    updateCandidateStatus(id, status) {
        if (this.data.candidates[id]) {
            this.data.candidates[id].status = status;
            this.saveData();
        }
    }

    deleteProfile(id) {
        delete this.data.profiles[id];
        this.saveData();
    }

    addSkill(profileId, skill) {
        if (this.data.profiles[profileId]) {
            this.data.profiles[profileId].skills.push(skill);
            this.saveData();
        }
    }

    deleteSkill(profileId, index) {
        if (this.data.profiles[profileId]) {
            this.data.profiles[profileId].skills.splice(index, 1);
            this.saveData();
        }
    }

    addCandidate(candidate) {
        const id = Date.now().toString();
        this.data.candidates[id] = { ...candidate, id };
        this.saveData();
        return id;
    }

    deleteCandidate(id) {
        delete this.data.candidates[id];
        Object.keys(this.data.evaluations).forEach(evalId => {
            if (this.data.evaluations[evalId].candidateId === id) {
                delete this.data.evaluations[evalId];
            }
        });
        this.saveData();
    }

    getEvaluation(profileId, candidateId, vacancyId) {
        return Object.values(this.data.evaluations).find(e =>
            e.candidateId === candidateId &&
            e.profileId === profileId &&
            e.vacancyId === vacancyId
        );
    }

    createEvaluation(evaluation) {
        const id = Date.now().toString();
        this.data.evaluations[id] = { ...evaluation, id, feedback: [] };
        this.saveData();
        return this.data.evaluations[id];
    }

    addEvaluationFeedback(evalId, reviewer, comment, rating) {
        if (this.data.evaluations[evalId]) {
            this.data.evaluations[evalId].feedback.push({
                reviewer, comment, rating, date: new Date().toISOString()
            });
            this.saveData();
        }
    }

    updateEvaluationScore(evalId, skillIndex, score) {
        const evaluation = this.data.evaluations[evalId];
        if (evaluation) {
            evaluation.scores[skillIndex].score = parseInt(score);
            this.calculateGlobalScore(evaluation);
            this.saveData();
        }
    }

    updateEvaluationNotes(evalId, skillIndex, notes) {
        if (this.data.evaluations[evalId]) {
            this.data.evaluations[evalId].scores[skillIndex].notes = notes;
            this.saveData();
        }
    }

    updateEvaluationFinalRec(evalId, rec) {
        if (this.data.evaluations[evalId]) {
            this.data.evaluations[evalId].finalRecommendation = rec;
            this.saveData();
        }
    }

    calculateGlobalScore(evaluation) {
        let totalScore = 0;
        let totalWeight = 0;
        evaluation.skills.forEach((skill, index) => {
            totalScore += evaluation.scores[index].score * skill.weight;
            totalWeight += skill.weight;
        });
        evaluation.globalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    finishEvaluation(evalId) {
        if (this.data.evaluations[evalId]) {
            this.data.evaluations[evalId].status = 'Evaluado';
            this.saveData();
        }
    }

    addVacancy(vacancy) {
        const id = Date.now().toString();
        this.data.vacancies[id] = { ...vacancy, id, date: new Date().toISOString().split('T')[0] };
        this.saveData();
        return id;
    }

    deleteVacancy(id) {
        delete this.data.vacancies[id];
        this.saveData();
    }

    updateVacancyStatus(id, status) {
        if (this.data.vacancies[id]) {
            this.data.vacancies[id].status = status;
            this.saveData();
        }
    }

    resetData() {
        localStorage.removeItem('talentScoutData');
        location.reload();
    }
}
