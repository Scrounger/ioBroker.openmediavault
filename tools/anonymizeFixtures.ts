/**
 * Anonymization of recorded OpenMediaVault API responses (local fixtures only).
 *
 * - MAC addresses, IPv4/IPv6 addresses and UUIDs are replaced by placeholders of reserved ranges.
 *   The same input always gets the same placeholder within one recording run.
 * - Values under name-like keys (name, hostname, serial, email, user, comment, ...) and every occurrence
 *   of these values in free text are replaced by `name-N`.
 * - Values under secret-like keys (password, secret, token, key, ...) are replaced by `<redacted>`.
 * - Host names in URLs are replaced by `host.invalid`, paths and query strings are kept.
 * - Labels in `/dev/disk/by-label/<label>` and `dev-disk-by-label-<label>` are replaced by `name-N`.
 * - Literal secrets (controller host, user name, password) are removed from all strings.
 * - Version strings are not touched, because a dotted version can look like an IPv4 address.
 */

const NAME_KEY = /name$|hostname|serial|email|^user|comment|description|^note|label/i;
const SECRET_KEY = /pass|secret|token|cookie|key|private/i;
/** Keys that match NAME_KEY but carry no identifying information. */
const KEEP_KEYS = new Set(['cpuModelName', 'model', 'kernel']);

const MIN_SECRET_LENGTH = 4;
/** Shorter name values are replaced in their own key, but not in free text (avoids replacing single characters everywhere). */
const MIN_NAME_TEXT_LENGTH = 3;

const MAC_PATTERN = /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi;
const IPV4_PATTERN = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
/** Full form (8 groups) or compressed form with `::`. Plain times like `12:00:00` do not match. */
const IPV6_PATTERN = /\b(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\b|\b(?:[0-9a-f]{1,4}:){1,7}:(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){0,6})?/gi;
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const URL_HOST_PATTERN = /\b([a-z][a-z0-9+.-]*:\/\/)([^/\s"'?#]+)/gi;
const LABEL_PATTERN = /((?:\/dev\/disk\/by-label\/)|(?:dev-disk-by-label-))([^\s"'/]+)/g;

const PLACEHOLDER_MAC_PREFIX = '02:00:00:00:00:';
const PLACEHOLDER_IPV4_PREFIX = '198.51.100.';
const PLACEHOLDER_IPV6_PREFIX = '2001:db8::';
const PLACEHOLDER_UUID_PREFIX = '00000000-0000-4000-8000-';

/**
 * Stateful anonymizer. Use one instance per recording run so that placeholders are consistent across all files.
 */
export class Anonymizer {
    private readonly secrets: string[];
    private readonly names = new Map<string, string>();
    private readonly macs = new Map<string, string>();
    private readonly ipv4s = new Map<string, string>();
    private readonly ipv6s = new Map<string, string>();
    private readonly uuids = new Map<string, string>();

    /**
     * @param secrets literal values that must never appear in a fixture (host, user, password)
     */
    constructor(secrets: string[] = []) {
        this.secrets = secrets.filter(secret => secret.length >= MIN_SECRET_LENGTH);
    }

    /**
     * Collects all name-like values of a document, so that free text containing them is anonymized too.
     * Call this for all documents before `anonymize()`.
     *
     * @param value the value to scan
     * @param key the key under which the value is stored
     */
    collectNames(value: unknown, key = ''): void {
        if (Array.isArray(value)) {
            value.forEach(item => this.collectNames(item, key));
            return;
        }
        if (value && typeof value === 'object') {
            for (const [childKey, childValue] of Object.entries(value)) {
                this.collectNames(childValue, childKey);
            }
            return;
        }
        if (typeof value === 'string' && value.length > 0 && isNameKey(key)) {
            this.nameFor(value);
        }
    }

    /**
     * Returns an anonymized deep copy. The input is not modified.
     *
     * @param value the document to anonymize
     */
    anonymize<T>(value: T): T {
        return this.anonymizeValue(value, '') as T;
    }

    private anonymizeValue(value: unknown, key: string): unknown {
        if (Array.isArray(value)) {
            return value.map(item => this.anonymizeValue(item, key));
        }
        if (value && typeof value === 'object') {
            const result: Record<string, unknown> = {};
            for (const [childKey, childValue] of Object.entries(value)) {
                result[this.anonymizeText(childKey)] = this.anonymizeValue(childValue, childKey);
            }
            return result;
        }
        if (typeof value === 'string' && value.length > 0) {
            if (SECRET_KEY.test(key)) {
                return '<redacted>';
            }
            if (isNameKey(key)) {
                return this.nameFor(value);
            }
            return this.anonymizeText(value);
        }
        return value;
    }

    private anonymizeText(text: string): string {
        let result = text;

        for (const secret of this.secrets) {
            result = result.split(secret).join('<redacted>');
        }

        result = result.replace(URL_HOST_PATTERN, (_match, scheme: string) => `${scheme}host.invalid`);
        result = result.replace(LABEL_PATTERN, (_match, prefix: string, label: string) => `${prefix}${this.nameFor(label)}`);
        result = result.replace(UUID_PATTERN, uuid => this.placeholder(this.uuids, uuid.toLowerCase(), index => `${PLACEHOLDER_UUID_PREFIX}${String(index).padStart(12, '0')}`));
        result = result.replace(MAC_PATTERN, mac => this.placeholder(this.macs, mac.toLowerCase(), index => `${PLACEHOLDER_MAC_PREFIX}${(index & 0xff).toString(16).padStart(2, '0')}`));
        result = result.replace(IPV4_PATTERN, ip => this.placeholder(this.ipv4s, ip, index => `${PLACEHOLDER_IPV4_PREFIX}${(index % 254) + 1}`));
        result = result.replace(IPV6_PATTERN, ip => this.placeholder(this.ipv6s, ip.toLowerCase(), index => `${PLACEHOLDER_IPV6_PREFIX}${index.toString(16)}`));

        for (const [original, placeholder] of this.names) {
            if (original.length >= MIN_NAME_TEXT_LENGTH) {
                result = result.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(original)}(?![\\p{L}\\p{N}])`, 'gu'), placeholder);
            }
        }

        return result;
    }

    private nameFor(value: string): string {
        if (this.secrets.some(secret => value.includes(secret))) {
            return '<redacted>';
        }
        return this.placeholder(this.names, value, index => `name-${index}`);
    }

    private placeholder(map: Map<string, string>, original: string, create: (index: number) => string): string {
        const existing = map.get(original);
        if (existing !== undefined) {
            return existing;
        }
        const placeholder = create(map.size + 1);
        map.set(original, placeholder);
        return placeholder;
    }
}

/**
 * Anonymizes a list of documents with one shared anonymizer, so that identical values get identical placeholders.
 * The input documents are not modified.
 *
 * @param documents the documents to anonymize
 * @param secrets literal values that must be removed from all strings
 * @returns the anonymized copies
 */
export function anonymizeDocuments<T>(documents: T[], secrets: string[] = []): T[] {
    const anonymizer = new Anonymizer(secrets);
    documents.forEach(document => anonymizer.collectNames(document));
    return documents.map(document => anonymizer.anonymize(document));
}

/**
 * Returns the leaks found in a serialized fixture. An empty list means the fixture is clean.
 * Checks the secrets and all MAC, IPv4, IPv6 and UUID values that are not one of the reserved placeholders.
 *
 * @param serialized the serialized fixture (JSON text)
 * @param secrets literal values that must not appear
 * @returns a list of human-readable leak descriptions
 */
export function findLeaks(serialized: string, secrets: string[] = []): string[] {
    const leaks: string[] = [];

    for (const secret of secrets.filter(secret => secret.length >= MIN_SECRET_LENGTH)) {
        if (serialized.includes(secret)) {
            leaks.push(`secret value (${secret.length} characters)`);
        }
    }

    for (const mac of serialized.match(MAC_PATTERN) ?? []) {
        if (!mac.toLowerCase().startsWith(PLACEHOLDER_MAC_PREFIX)) {
            leaks.push(`MAC address ${mac}`);
        }
    }

    for (const ip of serialized.match(IPV4_PATTERN) ?? []) {
        if (!ip.startsWith(PLACEHOLDER_IPV4_PREFIX)) {
            leaks.push(`IPv4 address ${ip}`);
        }
    }

    for (const ip of serialized.match(IPV6_PATTERN) ?? []) {
        if (!ip.toLowerCase().startsWith(PLACEHOLDER_IPV6_PREFIX)) {
            leaks.push(`IPv6 address ${ip}`);
        }
    }

    for (const uuid of serialized.match(UUID_PATTERN) ?? []) {
        if (!uuid.toLowerCase().startsWith(PLACEHOLDER_UUID_PREFIX)) {
            leaks.push(`UUID ${uuid}`);
        }
    }

    return [...new Set(leaks)];
}

function isNameKey(key: string): boolean {
    return NAME_KEY.test(key) && !KEEP_KEYS.has(key);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
