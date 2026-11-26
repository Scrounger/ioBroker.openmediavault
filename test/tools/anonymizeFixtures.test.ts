/**
 * Offline tests for the anonymization of recorded fixtures (tools/anonymizeFixtures.ts).
 */
import { expect } from 'chai';
import { Anonymizer, anonymizeDocuments, findLeaks } from '../../tools/anonymizeFixtures.js';

describe('tools: anonymizeFixtures', () => {
    it('replaces MAC addresses with consistent placeholders', () => {
        const [first, second] = anonymizeDocuments([
            { response: { mac: '52:54:00:12:34:56' } },
            { response: { mac: '52:54:00:12:34:56', other: 'AA-BB-CC-DD-EE-FF' } },
        ]);

        expect(first.response.mac).to.match(/^02:00:00:00:00:[0-9a-f]{2}$/);
        expect(second.response.mac).to.equal(first.response.mac);
        expect(JSON.stringify(second)).to.not.include('52:54:00:12:34:56');
        expect(JSON.stringify(second)).to.not.include('AA-BB-CC-DD-EE-FF');
    });

    it('replaces IPv4 addresses but keeps dotted versions and times', () => {
        const [doc] = anonymizeDocuments([
            { response: { address: '192.168.178.20', version: '7.0.4-1 (Sandworm)', time: 'Mon Jan 01 12:00:00 2024' } },
        ]);

        expect(doc.response.address).to.match(/^198\.51\.100\.\d+$/);
        expect(doc.response.version).to.equal('7.0.4-1 (Sandworm)');
        expect(doc.response.time).to.equal('Mon Jan 01 12:00:00 2024');
    });

    it('replaces IPv6 addresses with documentation placeholders', () => {
        const [doc] = anonymizeDocuments([{ response: { address: 'fd00:1234:5678::42', full: '2001:0db8:0000:0000:0000:ff00:0042:8329' } }]);

        expect(doc.response.address).to.match(/^2001:db8::/);
        expect(doc.response.full).to.match(/^2001:db8::/);
    });

    it('replaces UUIDs consistently and keeps the UUID format', () => {
        const uuid = '3f1c9a2e-7b4d-4e8f-9a1b-0c2d3e4f5a6b';
        const [doc] = anonymizeDocuments([{ response: { uuid, path: `/srv/dev-disk-by-uuid-${uuid}` } }]);

        expect(doc.response.uuid).to.match(/^00000000-0000-4000-8000-\d{12}$/);
        expect(doc.response.path).to.include(doc.response.uuid);
        expect(JSON.stringify(doc)).to.not.include(uuid);
    });

    it('replaces name-like values, also in free text', () => {
        const [doc] = anonymizeDocuments([
            {
                response: {
                    hostname: 'nas-keller',
                    devicename: 'sda',
                    serialnumber: 'WD-WCC7K1234567',
                    devicelinks: ['/dev/disk/by-id/ata-WDC_WD40EFRX_WD-WCC7K1234567', '/dev/disk/by-label/Familienfotos'],
                    cpuModelName: 'Intel(R) Celeron(R) J4125',
                },
            },
            { response: { sharedfoldername: 'nas-keller-share' } },
        ]);

        expect(doc.response.hostname).to.match(/^name-\d+$/);
        expect(doc.response.serialnumber).to.match(/^name-\d+$/);
        const links = doc.response.devicelinks as string[];
        expect(links[0]).to.not.include('WD-WCC7K1234567');
        expect(links[1]).to.not.include('Familienfotos');
        expect(doc.response.cpuModelName).to.equal('Intel(R) Celeron(R) J4125');
        expect(JSON.stringify(doc)).to.not.include('nas-keller');
    });

    it('redacts values under secret-like keys', () => {
        const [doc] = anonymizeDocuments([{ response: { password: 'abc', apiToken: 'xyz123', privateKey: 'key-material' } }]);

        expect(doc.response.password).to.equal('<redacted>');
        expect(doc.response.apiToken).to.equal('<redacted>');
        expect(doc.response.privateKey).to.equal('<redacted>');
    });

    it('removes literal secrets from all strings', () => {
        const [doc] = anonymizeDocuments(
            [{ response: { info: 'login as admin on omv.local', text: 'Passwort: s3cret-pass' } }],
            ['admin', 's3cret-pass'],
        );

        expect(JSON.stringify(doc)).to.not.include('s3cret-pass');
        expect(JSON.stringify(doc)).to.not.include('admin');
    });

    it('replaces the host of URLs and keeps the path', () => {
        const [doc] = anonymizeDocuments([{ response: { url: 'https://omv.example.lan:443/rpc.php?x=1' } }]);

        expect(doc.response.url).to.equal('https://host.invalid/rpc.php?x=1');
    });

    it('does not modify the input documents', () => {
        const input = [{ response: { hostname: 'nas-keller', mac: '52:54:00:12:34:56' } }];
        const copy = JSON.parse(JSON.stringify(input));

        anonymizeDocuments(input);

        expect(input).to.deep.equal(copy);
    });

    it('uses one anonymizer for the whole run', () => {
        const anonymizer = new Anonymizer();
        const documents = [{ response: { hostname: 'nas-keller' } }, { response: { text: 'nas-keller is online' } }];
        documents.forEach(document => anonymizer.collectNames(document));

        const [first, second] = documents.map(document => anonymizer.anonymize(document));

        expect(second.response.text).to.equal(`${first.response.hostname} is online`);
    });

    describe('findLeaks', () => {
        it('reports raw identifiers', () => {
            const leaks = findLeaks(JSON.stringify({ mac: '52:54:00:12:34:56', ip: '192.168.1.5', secret: 's3cret-pass' }), ['s3cret-pass']);

            expect(leaks).to.include('MAC address 52:54:00:12:34:56');
            expect(leaks).to.include('IPv4 address 192.168.1.5');
            expect(leaks.some(leak => leak.startsWith('secret value'))).to.be.true;
        });

        it('accepts placeholders', () => {
            const [doc] = anonymizeDocuments([{ response: { mac: '52:54:00:12:34:56', ip: '192.168.1.5', id: '3f1c9a2e-7b4d-4e8f-9a1b-0c2d3e4f5a6b', v6: 'fd00::42' } }], ['s3cret-pass']);

            expect(findLeaks(JSON.stringify(doc), ['s3cret-pass'])).to.deep.equal([]);
        });
    });
});
