const GETTEXT_DOMAIN = 'fan-manager-extension';

const { GObject, St } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const modeMap = new Map()

modeMap.set('Quiet', 'quiet')
modeMap.set('Cool Bottom', 'cool-bottom')
modeMap.set("Balanced", "balanced")
modeMap.set("Performance", "performance")

function toArray(str) {
    return str.split(" ")
}

function handleError(error){
    Main.notify(error + ": gnome-extension-fan-manager experienced an error")
}

function setThermalMode(key){
    try {
        let proc = Gio.Subprocess.new(toArray("pkexec smbios-thermal-ctl --set-thermal-mode " + modeMap.get(key)), Gio.SubprocessFlags.NONE);
    
        proc.wait_check_async(null, (proc, result) => {
            try {
                if (proc.wait_check_finish(result)) {
                    Main.notify("Successfully changed to mode: " + key)
                } else {
                    Main.notify("gnome-extension-fan-manager experienced an error")
                }
            } catch (e) {
                handleError(e)
            }
        });
    } catch (e) {
        handleError(e)
    }
}

const ManagerButton = GObject.registerClass(
class ManagerButton extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Fan Manager');

        let gicon = Gio.icon_new_for_string(Me.path + "/resources/fan.png");

        this.add_child(new St.Icon({gicon}));  

        for (const key of modeMap.keys()){
            let item = new PopupMenu.PopupMenuItem(key);

            item.connect('activate', () => setThermalMode(key))

            this.menu.addMenuItem(item);
        }
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._managerButton = new ManagerButton();
        Main.panel.addToStatusArea(this._uuid, this._managerButton);
    }

    disable() {
        this._managerButton.destroy();
        this._managerButton = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
