import { asClass, createContainer } from 'awilix';
import { scopePerRequest } from 'awilix-express';
import express from 'express';
import { AuthService } from './services/AuthService';
import { DashboardService } from './services/DashboardService';
import { CategoryService } from './services/CategoryService';
import { ArticleService } from './services/ArticleService';
import { PersonService } from './services/PersonService';
import { UserService } from './services/UserService';
import { PurchaseService } from './services/PurchaseService';
import { DteService } from './services/DteService';
import { SaleService } from './services/SaleService';
import { PdfService } from './services/PdfService';
import { ReportsService } from './services/ReportsService';
import { ReportsExportService } from './services/ReportsExportService';
import { ComprehensiveReportService } from './services/ComprehensiveReportService';
import { AnalyticsService } from './services/AnalyticsService';
import { AuditService } from './services/AuditService';
import { RolService } from './services/RolService';
import { ComercioService } from './services/ComercioService';
import { InventoryService } from './services/InventoryService';
import { SucursalService } from './services/SucursalService';

export default (app: express.Application) => {
  const container = createContainer({
    injectionMode: 'CLASSIC'
  });

  container.register({
    authService: asClass(AuthService).scoped(),
    dashboardService: asClass(DashboardService).scoped(),
    categoryService: asClass(CategoryService).scoped(),
    articleService: asClass(ArticleService).scoped(),
    personService: asClass(PersonService).scoped(),
    userService: asClass(UserService).scoped(),
    purchaseService: asClass(PurchaseService).scoped(),
    dteService: asClass(DteService).scoped(),
    saleService: asClass(SaleService).scoped(),
    pdfService: asClass(PdfService).scoped(),
    reportsService: asClass(ReportsService).scoped(),
    reportsExportService: asClass(ReportsExportService).scoped(),
    comprehensiveReportService: asClass(ComprehensiveReportService).scoped(),
    analyticsService: asClass(AnalyticsService).scoped(),
    auditService: asClass(AuditService).scoped(),
    rolService: asClass(RolService).scoped(),
    comercioService: asClass(ComercioService).scoped(),
    sucursalService: asClass(SucursalService).scoped(),
    inventoryService: asClass(InventoryService).scoped(),
  });

  app.use(scopePerRequest(container));
};
