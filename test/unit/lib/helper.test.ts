import { expect } from 'chai';
import {
    getAllIdsOfTreeDefinition,
    getAllKeysOfTreeDefinition,
    getAllowedCommonStates,
    getObjectByString,
    zeroPad,
} from '../../../src/lib/helper.js';

describe('getObjectByString', () => {
    const obj = { a: { b: { c: 'value' } }, list: ['x', 'y'] };

    it('returns the value of a dot separated path', () => {
        expect(getObjectByString('a.b.c', obj)).to.equal('value');
    });

    it('accepts an array as path', () => {
        expect(getObjectByString(['a', 'b'], obj)).to.deep.equal({ c: 'value' });
    });

    it('uses a custom separator', () => {
        expect(getObjectByString('a/b/c', obj, '/')).to.equal('value');
    });

    it('returns undefined for a path that does not exist', () => {
        expect(getObjectByString('a.x.c', obj)).to.be.undefined;
    });
});

describe('getAllowedCommonStates', () => {
    it('maps every entry of the list at the path to itself', () => {
        expect(getAllowedCommonStates('list', { list: ['x', 'y'] })).to.deep.equal({ x: 'x', y: 'y' });
    });

    it('returns undefined if the path does not exist', () => {
        expect(getAllowedCommonStates('missing', {})).to.be.undefined;
    });

    it('returns an empty object for an empty list', () => {
        expect(getAllowedCommonStates('list', { list: [] })).to.deep.equal({});
    });
});

describe('zeroPad', () => {
    it('pads numbers with leading zeros up to the given places', () => {
        expect(zeroPad(5, 3)).to.equal('005');
        expect(zeroPad(42, 4)).to.equal('0042');
    });

    it('does not cut longer numbers', () => {
        expect(zeroPad(1234, 3)).to.equal('1234');
    });

    it('returns the number unchanged when it already has the given length', () => {
        expect(zeroPad(7, 1)).to.equal('7');
    });
});

describe('getAllKeysOfTreeDefinition', () => {
    it('collects nested keys and the valFromProperty targets', () => {
        const definition = {
            top: {
                sub: { valFromProperty: 'name' },
            },
        };

        expect(getAllKeysOfTreeDefinition(definition as any)).to.have.members(['top', 'top.sub', 'top.name']);
    });

    it('does not descend into states', () => {
        const definition = {
            top: {
                states: { foo: { valFromProperty: 'bar' } },
            },
        };

        expect(getAllKeysOfTreeDefinition(definition as any)).to.deep.equal(['top']);
    });

    it('returns unique keys', () => {
        const definition = {
            one: { valFromProperty: 'same' },
            two: { valFromProperty: 'same' },
        };

        const keys = getAllKeysOfTreeDefinition(definition as any);
        expect(keys.filter((key) => key === 'same')).to.have.length(1);
    });
});

describe('getAllIdsOfTreeDefinition', () => {
    it('uses idChannel as id of the channel and skips required definitions', () => {
        const definition = {
            a: {
                idChannel: 'chan',
                b: { required: true },
            },
        };

        expect(getAllIdsOfTreeDefinition(definition as any)).to.deep.equal(['chan']);
    });

    it('uses id as id when no idChannel exists', () => {
        const definition = {
            a: { id: 'x' },
        };

        expect(getAllIdsOfTreeDefinition(definition as any)).to.deep.equal(['x']);
    });
});
