import { TalentScoutModel } from './model/TalentScoutModel.js';
import { TalentScoutView } from './view/TalentScoutView.js';
import { TalentScoutController } from './controller/TalentScoutController.js';

/**
 * INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
    const model = new TalentScoutModel();
    const view = new TalentScoutView();
    const controller = new TalentScoutController(model, view);

    // Global exposure for inline handlers (legacy support for templates)
    window.appController = controller;

    // Initial setup
    controller.applyDarkMode(model.data.settings.darkMode);
    view.applyRBAC(model.data.settings.role);
    view.renderDashboard(model.data);

    console.log("TalentScout v4.0 Modular ATS Initialized");
});
