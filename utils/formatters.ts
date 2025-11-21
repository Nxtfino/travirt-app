
export const formatCurrency = (value: number, maximumFractionDigits: number = 2): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits,
    }).format(value);
};

export const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};