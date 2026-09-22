/** The Impact calculator's arithmetic and formatting, shared by the server
    render (default numbers, so the section reads without JS) and the client
    script (live numbers). Whole dollars, US format. */
export const weeklyCost = (wage: number, hours: number, people: number) => wage * hours * people;
export const yearlyCost = (weekly: number) => weekly * 52;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const money = (n: number) => usd.format(n);
