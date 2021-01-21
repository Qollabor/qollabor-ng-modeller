class SettingsStorage {
    /**
     * SettingsStorage is a global static class that holds a "plain" javascript object
     * and stores changes to it in localStorage.
     * So, all settings are done on a single js object, which enables the SettingsEditor to show all settings in a single text area.
     */
    constructor() {
    }

    static save(store) {
        SettingsStorage.store = store;
        const newStore = JSON.stringify(store);
        if (localStorage.getItem(STORAGE) != newStore) {
            // console.warn('Saving changed storage settings');
            localStorage.setItem(STORAGE, newStore);
        }
    }

    /**
     * @returns {SettingsStorage}
     */
    static getStorage() {
        if (! SettingsStorage.store) {
            const store = localStorage.getItem(STORAGE) || '{}';
            try {
                SettingsStorage.store = Object.assign(new SettingsStorage, JSON.parse(store));
            } catch (exception) {
                console.error('Cannot parse the settings storage. Creating an empty one; Invalid storage value:\n', store);
                console.error('Exception encountered while parsing value: ', exception);
                SettingsStorage.store = new SettingsStorage();
            }
        }
        return SettingsStorage.store;
    }

    static getItem(key) {
        return SettingsStorage.getStorage()[key];
    }

    static setItem(key, value) {
        const store = SettingsStorage.getStorage();
        store[key] = value;
        SettingsStorage.save(store);
    }
}
