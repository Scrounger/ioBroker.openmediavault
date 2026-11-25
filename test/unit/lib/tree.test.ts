import { expect } from 'chai';
import * as tree from '../../../src/lib/tree/index.js';

describe('tree definitions', () => {
    for (const [endpoint, definition] of Object.entries(tree)) {
        describe(endpoint, () => {
            const def = definition as any;

            it('has an idChannel', () => {
                expect(def.idChannel).to.be.a('string').that.is.not.empty;
            });

            it('provides a non-empty list of state ids', () => {
                expect(def.getStateIDs()).to.be.an('array').that.is.not.empty;
            });

            it('provides a get() function', () => {
                expect(def.get).to.be.a('function');
            });

            it('defines a channel name when iobObjectDefintions exists', () => {
                if (Object.hasOwn(def, 'iobObjectDefintions')) {
                    expect(def.iobObjectDefintions.channelName).to.be.a('string').that.is.not.empty;
                }
            });
        });
    }
});
