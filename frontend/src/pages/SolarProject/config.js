export const fields = {
    // Client Reference
    client: {
        type: 'link',
        label: 'Client Name',
        required: true,
    },
    contactNumber: {
        type: 'string',
        label: 'Contact No',
    },
    city: {
        type: 'string',
        label: 'City',
    },
    systemType: {
        type: 'string',
        label: 'System Type',
        dataIndex: ['systemDetails', 'systemType'],
    },
    status: {
        type: 'select',
        options: [
            { value: 'Active', label: 'Active' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Cancelled', label: 'Cancelled' },
        ],
        required: true,
    },

    // System Details
    'systemDetails.systemType': {
        type: 'select',
        label: 'System Type',
        options: [
            { value: 'OnGrid', label: 'OnGrid' },
            { value: 'Hybrid', label: 'Hybrid' },
            { value: 'OffGrid', label: 'OffGrid' },
        ],
        required: true,
    },
    'systemDetails.capacity': {
        type: 'string',
        label: 'Capacity (e.g. 5kW)',
        dataIndex: ['systemDetails', 'capacity'],
    },
    'systemDetails.solarPanelName': {
        type: 'string',
        label: 'Solar Panel Name',
        dataIndex: ['systemDetails', 'solarPanelName'],
    },
    'systemDetails.solarPanelWatt': {
        type: 'string',
        label: 'Solar Panel Watt',
        dataIndex: ['systemDetails', 'solarPanelWatt'],
    },
    'systemDetails.inverterName': {
        type: 'string',
        label: 'Inverter Name',
        dataIndex: ['systemDetails', 'inverterName'],
    },
    'systemDetails.structureHeight': {
        type: 'string',
        label: 'Structure Height',
        dataIndex: ['systemDetails', 'structureHeight'],
    },
    'systemDetails.walkway': {
        type: 'boolean',
        label: 'Walkway',
        dataIndex: ['systemDetails', 'walkway'],
    },

    // Bank & Loan
    'bankDetails.bankName': {
        type: 'string',
        label: 'Bank Name',
        dataIndex: ['bankDetails', 'bankName'],
    },
    'bankDetails.customerIfscCode': {
        type: 'string',
        label: 'Customer IFSC',
        dataIndex: ['bankDetails', 'customerIfscCode'],
    },
    'bankDetails.solarRooftopIfscCode': {
        type: 'string',
        label: 'Solar Rooftop IFSC',
        dataIndex: ['bankDetails', 'solarRooftopIfscCode'],
    },
    'bankDetails.sanctionedAmount': {
        type: 'currency',
        label: 'Sanctioned Amount',
        dataIndex: ['bankDetails', 'sanctionedAmount'],
    },
    'bankDetails.totalLoanAmount': {
        type: 'currency',
        label: 'Total Loan Amount',
        dataIndex: ['bankDetails', 'totalLoanAmount'],
    },

    // Payment Tracking
    'paymentDetails.totalProjectCost': {
        type: 'currency',
        label: 'Total Project Cost',
        dataIndex: ['paymentDetails', 'totalProjectCost'],
    },
    'paymentDetails.advancePayment': {
        type: 'currency',
        label: 'Advance Payment',
        dataIndex: ['paymentDetails', 'advancePayment'],
    },
    'paymentDetails.loanCreditedAmount': {
        type: 'currency',
        label: 'Loan Credited Amount',
        dataIndex: ['paymentDetails', 'loanCreditedAmount'],
    },

    // Completion (Usually for updates, but can be here)
    'completionDetails.isInstallationCompleted': {
        type: 'boolean',
        label: 'Installation Completed',
        dataIndex: ['completionDetails', 'isInstallationCompleted'],
    },
    'completionDetails.completionDate': {
        type: 'date',
        label: 'Completion Date',
        dataIndex: ['completionDetails', 'completionDate'],
    },
    'completionDetails.inverterModelNumber': {
        type: 'string',
        label: 'Inverter Model No',
        dataIndex: ['completionDetails', 'inverterModelNumber'],
    },
    'projectState': {
        type: 'string',
        label: 'State',
    },
    'proejctCity': {
        type: 'string',
        label: 'City',
    }
};
