export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  role?: string[];
  isMainParent?: boolean;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/default',
        icon: 'ti ti-dashboard',
        breadcrumbs: true
      },
      {
        id: 'admin-dashboard',
        title: 'Admin Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard/admin',
        icon: 'ti ti-layout-dashboard',
        breadcrumbs: true
      },
      {
        id: 'doctor-dashboard',
        title: 'Doctor Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard/doctor',
        icon: 'ti ti-stethoscope',
        breadcrumbs: true
      },
      {
        id: 'pharmacy-dashboard',
        title: 'Pharmacy Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard/pharmacy',
        icon: 'ti ti-pill',
        breadcrumbs: true
      }
    ]
  },

  {
    id: 'patients',
    title: 'Patient Management',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'patient-registration',
        title: 'Patient Registration',
        type: 'item',
        classes: 'nav-item',
        url: '/patients/registration',
        icon: 'ti ti-user-plus',
        breadcrumbs: true
      },
      {
        id: 'token-generation',
        title: 'Token Generation',
        type: 'item',
        classes: 'nav-item',
        url: '/patients/token',
        icon: 'ti ti-ticket',
        breadcrumbs: true
      },
      {
        id: 'patient-history',
        title: 'Patient History',
        type: 'item',
        classes: 'nav-item',
        url: '/patients/history',
        icon: 'ti ti-history',
        breadcrumbs: true
      }
    ]
  },

  {
    id: 'prescriptions',
    title: 'Prescriptions',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'prescription-create',
        title: 'Create Prescription',
        type: 'item',
        classes: 'nav-item',
        url: '/prescriptions/create',
        icon: 'ti ti-file-plus',
        breadcrumbs: true
      },
      {
        id: 'prescription-list',
        title: 'Prescription List',
        type: 'item',
        classes: 'nav-item',
        url: '/prescriptions/list',
        icon: 'ti ti-list',
        breadcrumbs: true
      }
    ]
  },

  {
    id: 'inventory',
    title: 'Inventory Management',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'inward-list',
        title: 'Inward List',
        type: 'item',
        classes: 'nav-item',
        url: '/inventory/inward',
        icon: 'ti ti-arrow-down-circle',
        breadcrumbs: true
      },
      {
        id: 'inward-create',
        title: 'Create Inward',
        type: 'item',
        classes: 'nav-item',
        url: '/inventory/inward/create',
        icon: 'ti ti-plus',
        breadcrumbs: true
      },
      {
        id: 'upload-invoice',
        title: 'Upload Invoice',
        type: 'item',
        classes: 'nav-item',
        url: '/inventory/inward/upload',
        icon: 'ti ti-upload',
        breadcrumbs: true
      },
      {
        id: 'stock-list',
        title: 'Stock List',
        type: 'item',
        classes: 'nav-item',
        url: '/inventory/stock',
        icon: 'ti ti-package',
        breadcrumbs: true
      },
      {
        id: 'stock-adjustment',
        title: 'Stock Adjustment',
        type: 'item',
        classes: 'nav-item',
        url: '/inventory/adjustments/create',
        icon: 'ti ti-adjustments',
        breadcrumbs: true
      },
      {
        id: 'outsourced-medicines',
        title: 'Outsourced Medicines',
        type: 'item',
        classes: 'nav-item',
        url: '/inventory/outsourced',
        icon: 'ti ti-external-link',
        breadcrumbs: true
      }
    ]
  },

  {
    id: 'pharmacy',
    title: 'Pharmacy',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dispensing-queue',
        title: 'Dispensing Queue',
        type: 'item',
        classes: 'nav-item',
        url: '/pharmacy/dispensing-queue',
        icon: 'ti ti-clock',
        breadcrumbs: true
      },
      {
        id: 'dispense-medicine',
        title: 'Dispense Medicine',
        type: 'item',
        classes: 'nav-item',
        url: '/pharmacy/dispense',
        icon: 'ti ti-first-aid-kit',
        breadcrumbs: true
      },
      {
        id: 'return-medicine',
        title: 'Return Medicine',
        type: 'item',
        classes: 'nav-item',
        url: '/pharmacy/return',
        icon: 'ti ti-arrow-back-up',
        breadcrumbs: true
      },
      {
        id: 'dispensing-history',
        title: 'Dispensing History',
        type: 'item',
        classes: 'nav-item',
        url: '/pharmacy/history',
        icon: 'ti ti-history',
        breadcrumbs: true
      }
    ]
  },

  {
    id: 'audit',
    title: 'Audit & Compliance',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'audit-trail',
        title: 'Audit Trail',
        type: 'item',
        classes: 'nav-item',
        url: '/audit/trail',
        icon: 'ti ti-file-search',
        breadcrumbs: true
      },
      {
        id: 'compliance-reports',
        title: 'Compliance Reports',
        type: 'item',
        classes: 'nav-item',
        url: '/audit/compliance',
        icon: 'ti ti-shield-check',
        breadcrumbs: true
      },
      {
        id: 'theft-alerts',
        title: 'Theft Alerts',
        type: 'item',
        classes: 'nav-item',
        url: '/audit/theft-alerts',
        icon: 'ti ti-alert-triangle',
        breadcrumbs: true
      }
    ]
  },
  
  {
    id: 'reports',
    title: 'Reports',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'stock-reports',
        title: 'Stock Reports',
        type: 'item',
        classes: 'nav-item',
        url: '/reports/stock',
        icon: 'ti ti-report',
        breadcrumbs: true
      },
      {
        id: 'prescription-reports',
        title: 'Prescription Reports',
        type: 'item',
        classes: 'nav-item',
        url: '/reports/prescriptions',
        icon: 'ti ti-file-text',
        breadcrumbs: true
      },
      {
        id: 'patient-reports',
        title: 'Patient Reports',
        type: 'item',
        classes: 'nav-item',
        url: '/reports/patients',
        icon: 'ti ti-users',
        breadcrumbs: true
      },
      {
        id: 'pharmacy-reports',
        title: 'Pharmacy Reports',
        type: 'item',
        classes: 'nav-item',
        url: '/reports/pharmacy',
        icon: 'ti ti-pill',
        breadcrumbs: true
      },
      {
        id: 'application-reports',
        title: 'Application Reports',
        type: 'collapse',
        icon: 'ti ti-file-description', 
        children: [
          {
            id: 'application-reports',
            title: 'Application Reports',
            type: 'item',
            url: 'application-reports',
            breadcrumbs: true
          }
        ]
      },
      {
        id: 'ChatBotTranscript',
        title: 'Chat Bot Transcript',
        type: 'collapse',
        icon: 'ti ti-file-description',
        children: [
          {
            id: 'chat-bot-transcript',
            title: 'Chat Bot Transcript',
            type: 'item',
            url: 'chat-bot-transcript',
            breadcrumbs: true
          }
        ]
      }
    ]
  }
];
