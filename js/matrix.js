var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function communicateWithMatrix(ipAddress, path) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "http://" + ipAddress + path;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
            let response = yield fetch(url, { signal: controller.signal });
            let data = yield response.json();
            if (!("Result" in data)) {
                throw new Error("Invalid response from the matrix.");
            }
            if (data["Result"] !== true) {
                throw new Error("Result not returned from the matrix.");
            }
            return data;
        }
        catch (err) {
            throw new Error("Unable to communicate with the matrix.");
        }
    });
}
export function isAlive(ipAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = yield communicateWithMatrix(ipAddress, "/System/Details");
        if (data["StatusMessage"] !== "Healthy") {
            throw new Error("Matrix is unhealthy and probably needs rebooting.");
        }
    });
}
function getPortList(ipAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = yield communicateWithMatrix(ipAddress, "/Port/List");
        let inputPorts = [];
        let outputPorts = [];
        for (let i = 0; i < data["Ports"].length; i++) {
            let port = data["Ports"][i];
            if (port.Mode === "Input") {
                inputPorts.push(port);
            }
            else if (port.Mode === "Output") {
                outputPorts.push(port);
            }
        }
        const listOfPorts = { Input: inputPorts, Output: outputPorts };
        return listOfPorts;
    });
}
export function getConnectionInfo(ipAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        let portDetails = yield getPortList(ipAddress);
        let ioMapping = new Map();
        for (let i = 0; i < portDetails.Input.length; i++) {
            let inputPortInfo = portDetails.Input[i];
            let bay = inputPortInfo.Bay;
            let inputPortDetails = yield communicateWithMatrix(ipAddress, "/Port/Details/Input/" + bay);
            let connectedOutputs = inputPortDetails["TransmissionNodes"];
            ioMapping.set(bay, connectedOutputs);
        }
        const info = { Input: portDetails.Input, Output: portDetails.Output, inputToOutputMapping: ioMapping };
        return info;
    });
}
export function switchTo(ipAddress, inputBay, outputBays) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Switching input " + inputBay + " to outputs " + outputBays);
        for (let i = 0; i < outputBays.length; i++) {
            const path = "/Port/Set/" + inputBay + "/" + outputBays[i];
            yield communicateWithMatrix(ipAddress, path);
        }
    });
}
