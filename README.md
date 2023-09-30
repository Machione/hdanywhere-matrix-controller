# HDanywhere Matrix Controller

Video matrices are very useful when you want to drive multiple displays from multiple input sources and have the ability to switch inputs and outputs on the fly. One such matrix is the [HDanywhere Modular system](https://www.insideci.co.uk/hdanywhere-8x8-modular-matrix-to-debut-at-ise-2014.aspx). However, the [web-based UI](https://drive.google.com/file/d/0ByG6GV42ppa9RlRpRFJ0NmVBejA/view?usp=share_link&resourcekey=0-1e1_g7NtNWsVpLa1frCrqg) that is available via the matrix's IP address only supports switching one output at a time. For production applications, this can be tedious and unprofessional since there are situations where we'd like to switch several outputs over to a given input source all at once and as quickly as possible. While this is possible via [third-party drivers](http://support.hdanywhere.com/2014/03/control-drivers-for-modular-series-ip-rs232-ir-mod44-and-mod88/#more-1429), these are difficult to set up, and can be costly or platform dependant.

This controller is designed to allow multi-output switching via a single button click through a lightweight, intuitive, yet powerful web-based UI that can run anywhere.

> insert screenshot

Although this controller is designed to work with the HDanwhere Modular matrices (8x8 tested, but should also work with the 4x4), it should be easy to apply the same methodology to any brand or model of matrix that supports control over HTTP requests. All the interaction with the matrix has been abstracted into the [matrix.ts](./ts/matrix.ts), so that should be the only code that you need to edit to make it work with your brand/model.

## Features

- Lines connecting inputs to outputs show clearly how the matrix is currently configured.
- Simply switch outputs to a given input by clicking on the desired input.
- Inputs are automatically hidden if they're disconnected.
- Outputs can be "locked" meaning that they will never be switched from their configured input source.
- Status icons show which inputs and outputs are connected to devices, disconnected, or locked.
- Input and output names are read from the matrix for clear indication of sources and destinations.
- Configuration via a simple [config.ts](./ts/config.ts).
- User prompted for IP Address which is useful if the matrix is using DHCP.
- Advanced options allow the selection of which outputs exactly to switch over.
- Proper error reporting and handling to diagnose if something has gone wrong.
- Auto-refreshes regularly so that if settings are changed elsewhere, the page will be updated.

## Installation

1. Download the [latest release](https://github.com/Machione/hdanywhere-matrix-controller/releases/latest).
2. The code is designed to run within a simple HTTP server. If your system has [Python 3](https://www.python.org) installed, then this is as simple as executing `python3 -m http.server` from within the directory of the index.html. If not, then try [Mongoose](https://mongoose.ws/binary/).
3. Go to <http://localhost:8000/>.

## Special Thanks

- [LeaderLine](https://anseki.github.io/leader-line/)
- [Font Awesome](https://fontawesome.com)
- The HDanywhere support team. Although the product I was using for testing is discontinued, they were very supportive and helpful with my enquiries. In particular, this [manual of HTTP, IR, and serial codes was helpful](https://docs.google.com/document/d/12xdnd2cLizXNOwUH1vIXhhS6DVLToKhTEnpuNrifNjk/edit?usp=sharing) was helpful.

## Development

Don't edit the Javascript directly. Instead compile the Javascript from Typescript using `tsc`.
