const mongoose = require('mongoose');

const projectDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, default: 'Document' },
  uploadDate: { type: Date, default: Date.now }
});

const externalFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  link: { type: String, required: true },
  isFilled: { type: Boolean, default: false }
});

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  client: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Active', // Active, Completed, Cancelled
  },
  agentCommission: {
    type: Number,
    default: 0,
  },
  // Personal Information
  contactNumber: String,
  email: String,
  address: String,
  city: String, // Kept for backward compatibility/filtering
  pinCode: String,
  consumerNumber: String,
  villageCity: String,
  lightBillGeneratedDate: Date,
  currentLoadOnLightBill: Number,
  additionalLoad: Number,
  solarRooftopApplicationNo: String,
  // 5. Solar System Details
  systemDetails: {
    systemType: {
      type: String,
      enum: ['OnGrid', 'Hybrid', 'OffGrid'],
      required: true,
    },
    capacity: String, // e.g., "5kW"
    solarPanelName: String,
    solarPanelWatt: String,
    solarPanelNos: Number,
    inverterName: String,
    structureHeight: String,
    walkway: {
      type: Boolean,
      default: false,
    },
  },
  // 6. Bank & Loan Details
  bankDetails: {
    isBankLoan: {
      type: Boolean,
      default: false,
    },
    bankName: String,
    sanctionedAmount: Number,
    customerIfscCode: String,
    solarRooftopIfscCode: String,
    totalLoanAmount: Number,
  },
  // 7. Payment Details (Tracker)
  paymentDetails: {
    totalProjectCost: Number,
    advancePayments: [{
      amount: Number,
      mode: String, // Cash, Online, Cheque
      date: Date
    }],
    loanDisbursals: [{
      amount: Number,
      date: Date
    }],
    loanCreditedAmount: Number,
    loanCreditedDate: Date,
    loanCreditedBank: String,
    paymentHistory: [{
      amount: Number,
      date: Date,
      mode: String, // Cash, Cheque, Online
      description: String
    }]
  },
  // 8. Solar Panel Completion
  completionDetails: {
    isInstallationCompleted: {
      type: Boolean,
      default: false
    },
    completionDate: Date,
    solarPanelSerialNumbers: [String],
    inverterModelNumber: String,
    externalForms: [externalFormSchema],
    siteStatus: {
      type: String,
      default: 'Pending', // Pending, Completed
      enum: ['Pending', 'Completed']
    }
  },
  // Project Documentation (Forms & Uploads)
  // Document Sub-schema
  projectDocuments: [projectDocumentSchema],
  proejctCity: String, // For filtering
  projectState: String, // For filtering

  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  remarks: {
    step1: String,
    step2: String,
    step3: String
  },
  loanRemarksHistory: [{
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  personalRemarksHistory: [{
    comment: String,
    date: { type: Date, default: Date.now }
  }]
});

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('SolarProject', schema);
