const GETTEXT_DOMAIN = 'fan-manager-extension';

const { GObject, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const _ = ExtensionUtils.gettext;

function toArray(str) {
    return str.split(" ")
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Fan Manager'));

        let gicon = Gio.icon_new_for_string(Me.path + "/resources/fan.png");

        this.add_child(new St.Icon({gicon}));  

        const map = new Map()

        map.set('Quiet', 'quiet')
        map.set('Cool Bottom', 'cool-bottom')
        map.set("Balanced", "balanced")
        map.set("Performance", "performance")

        for (const key of map.keys()){
            let item = new PopupMenu.PopupMenuItem(_(key));

            item.connect('activate', () => {
                try {
                    let proc = Gio.Subprocess.new(toArray("pkexec smbios-thermal-ctl --set-thermal-mode " + map.get(key)), Gio.SubprocessFlags.NONE);
                
                    proc.wait_check_async(null, (proc, result) => {
                        try {
                            if (proc.wait_check_finish(result)) {
                                Main.notify("Successfully changed to mode: " + key)
                            } else {
                                Main.notify("Error")
                            }
                        } catch (e) {
                            Main.notify(e.toString())
                        }
                    });
                } catch (e) {
                    Main.notify(_(e))
                }
            })

            this.menu.addMenuItem(item);
        }
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
