import { expect } from 'chai';
import * as tree from '../../../src/lib/tree/index.js';
import { describeWithFixtures, getFixtureRecords, getSmartDevices } from '../helpers/fixtures.js';

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

/**
 * Smart attributes whose names are anonymized in the recorded fixtures (`attrname` becomes `name-N`),
 * so their presence and type cannot be checked against real data.
 */
const ANONYMIZED_SMART_ATTRIBUTES = ['spin_retry_count', 'spin_up_time', 'start_stop_count', 'total_lbas_written', 'total_lbas_read'];

interface StateLeaf {
    /** path of the key in the recorded data */
    path: string[];
    def: any;
}

/**
 * Flattens a tree definition into its states. Nested `object` definitions are followed, `valFromProperty` replaces the key.
 *
 * @param defs the tree definition from `get()`
 * @param prefix the path of the parent object
 */
function collectLeaves(defs: Record<string, any>, prefix: string[] = []): StateLeaf[] {
    return Object.entries(defs).flatMap(([key, def]) => {
        const path = [...prefix, def.valFromProperty ?? key];
        return def.object ? collectLeaves(def.object, path) : [{ path, def }];
    });
}

/**
 * Reads a value from a recorded entry by its path.
 *
 * @param record the recorded entry
 * @param path the path of the key
 */
function valueAt(record: any, path: string[]): unknown {
    return path.reduce((current, segment) => current?.[segment], record);
}

describeWithFixtures('tree definitions against recorded fixtures', () => {
    for (const [endpoint, definition] of Object.entries(tree)) {
        describe(endpoint, () => {
            const def = definition as any;
            const records: any[] | undefined = endpoint === 'smart' ? getSmartDevices() : getFixtureRecords(endpoint);
            const leaves = collectLeaves(def.get()).filter(leaf => !(endpoint === 'smart' && ANONYMIZED_SMART_ATTRIBUTES.includes(leaf.path.at(-1) as string)));

            it('has a recorded fixture with entries', () => {
                expect(records, `no fixture for endpoint '${endpoint}'`).to.be.an('array').that.is.not.empty;
            });

            it('finds every state in the recorded data', () => {
                const missing = leaves
                    .filter(leaf => !records?.some(record => valueAt(record, leaf.path) !== undefined))
                    .map(leaf => leaf.path.join('.'));

                expect(missing, 'states without recorded value').to.deep.equal([]);
            });

            it('converts every recorded value to the declared iobType', () => {
                const problems = new Set<string>();

                for (const leaf of leaves) {
                    if (!['number', 'string', 'boolean'].includes(leaf.def.iobType)) {
                        continue;
                    }
                    for (const record of records ?? []) {
                        const raw = valueAt(record, leaf.path);
                        if (raw === undefined) {
                            continue;
                        }
                        const value = leaf.def.readVal ? leaf.def.readVal(raw, undefined, record, undefined, '') : raw;
                        const isNaNumber = typeof value === 'number' && Number.isNaN(value);

                        if (typeof value !== leaf.def.iobType || isNaNumber) {
                            problems.add(`${leaf.path.join('.')}: ${JSON.stringify(raw)} becomes ${JSON.stringify(value)} (${typeof value}), expected ${leaf.def.iobType}`);
                        }
                    }
                }

                expect([...problems]).to.deep.equal([]);
            });

            if (def.iobObjectDefintions?.deviceIdProperty) {
                it('yields unique, non-empty device ids for every recorded device', () => {
                    const { deviceIdProperty } = def.iobObjectDefintions;
                    const ids: string[] = (records ?? []).map(record => typeof deviceIdProperty === 'function'
                        ? deviceIdProperty(record, undefined)
                        : record[deviceIdProperty]);

                    const empty = ids.filter(id => !id);
                    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

                    expect(empty, 'devices without id').to.deep.equal([]);
                    expect(duplicates, 'duplicate device ids').to.deep.equal([]);
                });
            }
        });
    }
});
