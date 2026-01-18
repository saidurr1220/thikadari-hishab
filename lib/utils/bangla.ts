export const labels = {
  // Common
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  view: "View",
  download: "Download",
  print: "Print",
  search: "Search",
  filter: "Filter",
  export: "Export",
  add: "Add",
  create: "Create",
  update: "Update",
  submit: "Submit",
  approve: "Approve",
  reject: "Reject",

  // Navigation
  home: "Home",
  dashboard: "Dashboard",
  labor: "Labor",
  materials: "Materials",
  activities: "Site Expenses",
  advances: "Advances",
  expenses: "Expenses",
  reports: "Reports",
  settings: "Settings",
  admin: "Admin",
  logout: "Logout",

  // Forms
  date: "Date",
  amount: "Amount",
  quantity: "Quantity",
  unit: "Unit",
  rate: "Rate",
  total: "Total",
  description: "Description",
  notes: "Notes",
  attachments: "Attachments",

  // Labor
  laborType: "Labor type",
  contract: "Contract",
  daily: "Daily",
  crewName: "Crew name",
  laborName: "Labor name",
  workType: "Work type",
  headcount: "Headcount",
  khoraki: "Khoraki",
  khorakiPerHead: "Khoraki per head",
  khorakiTotal: "Khoraki total",
  wage: "Wage",
  wageTotal: "Wage total",

  // Materials
  item: "Item",
  supplier: "Supplier",
  paymentMethod: "Payment method",
  paymentRef: "Payment reference",
  bulkBreakdown: "Bulk breakdown",
  baseRate: "Base rate",
  baseCost: "Base cost",
  transport: "Transport",
  transportCost: "Transport cost",
  unloading: "Unloading",
  unloadingRate: "Unloading rate",
  unloadingCost: "Unloading cost",
  grandTotal: "Grand total",

  // Activities
  category: "Category",
  subcategory: "Subcategory",
  vendor: "Vendor",

  // Advances
  person: "Person",
  role: "Role",
  purpose: "Purpose",
  balance: "Balance",
  currentBalance: "Current balance",
  totalAdvances: "Total advances",
  totalExpenses: "Total expenses",

  // Tender
  tender: "Tender",
  tenderCode: "Tender code",
  projectName: "Project name",
  location: "Location",
  clientDepartment: "Client department",
  startDate: "Start date",
  endDate: "End date",

  // Status
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  inactive: "Inactive",

  // Reports
  dailySheet: "Daily sheet",
  laborRegister: "Labor register",
  materialsRegister: "Materials register",
  activityRegister: "Site Expenses Register",
  advanceLedger: "Advance ledger",
  tenderSummary: "Tender summary",

  // Settings
  settingsLabel: "Settings",

  // Time periods
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This week",
  thisMonth: "This month",
  lastMonth: "Last month",
  customRange: "Custom range",

  // Validation
  required: "This field is required",
  invalidAmount: "Invalid amount",
  invalidDate: "Invalid date",
  invalidEmail: "Invalid email",
  invalidPhone: "Invalid phone",

  // Messages
  saveSuccess: "Saved successfully",
  saveError: "Save failed",
  deleteConfirm: "Are you sure you want to delete?",
  deleteSuccess: "Deleted successfully",
  updateSuccess: "Updated successfully",
  loading: "Loading...",
  noData: "No data available",

  // Payment methods
  cash: "Cash",
  bank: "Bank",
  mfs: "MFS",
  advance: "Advance",
};

export function getBanglaNumber(num: number): string {
  return num.toString();
}

export function formatBanglaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB");
}
