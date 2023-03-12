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

function _isFound(str) {
    var f = false;
    for(var i=0; i < str.length;i++) {
        if(str[i] == "~") {
            f = true;
        }
    }

    if(f) {
        let re = /~/gi;
        let s = str.replace(re, GLib.get_home_dir());
        return [f, s];
    }
    else {
        return [f,str];
    }
}

function _toUtfArray(str) {
    let [f, s2] = _isFound(str);
    let arr = s2.split(" ");

    return arr;
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
                    let proc = Gio.Subprocess.new(_toUtfArray("pkexec smbios-thermal-ctl --set-thermal-mode " + map.get(key)), Gio.SubprocessFlags.NONE);
                
                    proc.wait_check_async(null, (proc, result) => {
                        try {
                            if (proc.wait_check_finish(result)) {
                                Main.notify(_(map.get(key)))
                            } else {
                                Main.notify(_("Error"))
                            }
                        } catch (e) {
                            Main.notify(_(e.toString()))
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
