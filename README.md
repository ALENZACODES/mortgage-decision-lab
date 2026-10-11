# Mortgage Decision Lab

[![tests](https://github.com/ALENZACODES/mortgage-decision-lab/actions/workflows/tests.yml/badge.svg)](https://github.com/ALENZACODES/mortgage-decision-lab/actions/workflows/tests.yml)

**Live:** https://alenzacodes.github.io/mortgage-decision-lab/

![Decision lab on desktop](docs/screenshot-desktop.png)

The questions people actually ask before buying, answered on one page: what will the payment be, will I pass the stress test, how much down do I need, what happens if rates move, rent or buy, and what does it cost to break the mortgage. It also puts a Canadian mortgage beside a US 30-year fixed, since the two are often compared and work very differently.

## The calculators

1. Payment and debt service (GDS/TDS at the qualifying rate, and the highest price that passes)
2. Down payment minimum and insurance
3. Rate sensitivity
4. Renewal payment change
5. Rent vs buy
6. Prepayment savings and penalty (three months' interest vs. IRD)

Results can be shared as a link or exported as a PDF summary.

## Running it

Open `index.html` or serve the folder with `python3 -m http.server`.

## Tests

    node tests/test.js

22 checks, including known payments ($500,000 at 5% over 25 years in Canada is $2,908.02/month; $400,000 at 6.5% over 30 years in the US is $2,528.27), schedules that end at zero, and the max purchase landing exactly on the binding GDS or TDS limit. They run on every push.

## Sources

- Interest Act, semi-annual compounding: https://laws-lois.justice.gc.ca/eng/acts/i-15/page-1.html
- OSFI minimum qualifying rate: https://www.osfi-bsif.gc.ca/en/news/osfi-announces-minimum-qualifying-rate-uninsured-mortgages-remain-unchanged
- CMHC premiums and GDS/TDS limits: https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs/cmhc-mortgage-loan-insurance-cost
- FCAC prepayment penalties: https://www.canada.ca/en/financial-consumer-agency/services/mortgages/prepayment-penalty-mortgage.html
- Bank of Canada renewal analysis: https://www.bankofcanada.ca/2025/07/staff-analytical-note-2025-21/

US figures use a 30-year fixed with monthly compounding and are for comparison only.

---

Educational only, not financial advice. John Khan.
