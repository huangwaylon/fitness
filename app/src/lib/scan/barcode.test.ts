import { describe, expect, it } from 'vitest';
import { barcodeKeys, checkOk, upcEtoA } from './barcode.ts';

describe('checkOk: the GS1 check digit', () => {
  it('passes JAN-13, UPC-A, EAN-8 and GTIN-14 codes with theirs, fails one digit off', () => {
    for (const c of ['4902102072618', '036000291452', '96385074', '00041867', '10049021020724']) expect(checkOk(c), c).toBe(true);
    for (const c of ['4902102072619', '036000291453', '96385075', '4902102O72618', '1234567', '']) expect(checkOk(c), c).toBe(false);
  });
});

describe('upcEtoA', () => {
  it('expands each of the last digit rules (0–2, 3, 4, 5–9) and checks the result', () => {
    expect(upcEtoA('04252614')).toBe('042100005264');
    expect(upcEtoA('06543217')).toBe('065100004327'); // (GS1's own example)
    expect(upcEtoA('01234505')).toBe('012000003455');
    expect(upcEtoA('01234531')).toBe('012300000451');
    expect(upcEtoA('01234543')).toBe('012340000053');
    expect(upcEtoA('01234558')).toBe('012345000058');
    expect(upcEtoA('04252615')).toBeNull(); // its check digit wrong
    expect(upcEtoA('24252614')).toBeNull(); // number system 2: not a UPC-E
  });
});

describe('barcodeKeys: a code as the products key it (13 or 8 digits)', () => {
  it('keeps a JAN-13 and an EAN-8, zero-pads a UPC-A, drops a GTIN-14 pack digit 0', () => {
    expect(barcodeKeys('4902102072618')).toEqual(['4902102072618']);
    expect(barcodeKeys('96385074')).toEqual(['96385074']);
    expect(barcodeKeys('036000291452')).toEqual(['0036000291452']);
    expect(barcodeKeys('04902102072618')).toEqual(['4902102072618']);
    expect(barcodeKeys('10049021020724')).toEqual([]); // a case's GTIN-14: not the product's
  });
  it('reads typed text: full-width digits, spaces and hyphens', () => {
    expect(barcodeKeys('４９０２ １０２-０７２６１８')).toEqual(['4902102072618']);
    expect(barcodeKeys(' 4902102072618\n')).toEqual(['4902102072618']);
  });
  it('an 8-digit code: the EAN-8 first, its UPC-E reading after; UPC-E first when the decoder says so', () => {
    expect(barcodeKeys('00041867')).toEqual(['00041867', '0000418000067']);
    expect(barcodeKeys('00041867', 'UPC-E')).toEqual(['0000418000067', '00041867']);
    expect(barcodeKeys('04252614', 'UPC-E')).toEqual(['0042100005264']);
  });
  it('none for a wrong check digit, letters or another length', () => {
    for (const c of ['4902102072619', '49021020726', 'abc', '', '490210207261899', 'QR:4902102072618']) expect(barcodeKeys(c), c).toEqual([]);
  });
});
