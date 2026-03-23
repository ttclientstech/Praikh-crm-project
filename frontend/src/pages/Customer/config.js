export const fields = {
  name: {
    type: 'string',
  },
  city: {
    type: 'string', // or specialized city type if available, default to string
    // color: 'red',
  },
  address: {
    type: 'string',
  },
  phone: {
    type: 'phone',
  },
  projectCost: {
    type: 'number',
    label: 'Project Cost',
  },
  projectKw: {
    type: 'number',
    label: 'Project Kilowatt',
  },
  remark: {
    type: 'textarea',
    label: 'Remark',
    required: false,
  },
};
