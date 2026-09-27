# btomarchy

An [Omarchy](https://omarchy.org/) Bluetooth bar widget — a fork of the
built-in `omarchy.bluetooth` that lets you **hide devices you don't want to
see while scanning**.

Living in an apartment, a Bluetooth scan can list every device belonging to
your neighbours. With this plugin you can mark any discovered device as
*hidden*, and it will never appear in a scan again — while your own connected
and paired devices are always shown.

## Features

- Connect / disconnect / forget devices (everything the stock widget does).
- **Hide** any discovered device from future scans (eye-off button).
- A **HIDDEN** section at the bottom of the panel lists hidden devices, so a
  mistaken hide can be undone with one click (eye button).
- Hidden devices are persisted in
  `~/.local/state/omarchy/bluetooth-ignored.json` and survive shell restarts
  and `omarchy update`.

## Install

```bash
omarchy plugin add https://github.com/cdelcollado/btomarchy --enable
```

If the widget doesn't appear in your bar automatically, place it:

```bash
omarchy plugin enable cdelcollado.bluetooth
```

## Usage

1. Click the Bluetooth icon in the bar.
2. Let it scan (or keep the panel open — it rescans automatically).
3. Hover a device under **AVAILABLE** and click the eye-off button (`󰈉`,
   tooltip "Hide").
4. To restore a device, open the **HIDDEN** section at the bottom and click
   the eye button (`󰈈`, tooltip "Show again").

## Development

This is a clone of `omarchy.bluetooth` (see `manifest.json` →
`omarchy.clonedFrom`), so it was originally authored by the Omarchy project.

The interesting bits:

- `Model.js` — device grouping + the `isIgnored` filter.
- `Panel.qml` — the panel UI, the hide/unhide buttons, and JSON persistence.

## License

Based on Omarchy's `omarchy.bluetooth` widget. See the
[Omarchy project](https://omarchy.org/) for upstream licensing.
