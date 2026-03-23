export const getStateOptions = () => {
    return [
        { value: 'Maharashtra', label: 'Maharashtra' },
        { value: 'Karnataka', label: 'Karnataka' },
        { value: 'Gujarat', label: 'Gujarat' },
        { value: 'Delhi', label: 'Delhi' }
    ];
};

export const getCityOptions = (state) => {
    const cities = {
        'Maharashtra': [
            { value: 'Mumbai', label: 'Mumbai' },
            { value: 'Pune', label: 'Pune' },
            { value: 'Nagpur', label: 'Nagpur' },
            { value: 'Nashik', label: 'Nashik' }
        ],
        'Karnataka': [
            { value: 'Bangalore', label: 'Bangalore' },
            { value: 'Mysore', label: 'Mysore' }
        ],
        'Gujarat': [
            { value: 'Ahmedabad', label: 'Ahmedabad' },
            { value: 'Surat', label: 'Surat' }
        ],
        'Delhi': [
            { value: 'New Delhi', label: 'New Delhi' }
        ]
    };
    return cities[state] || [];
};
