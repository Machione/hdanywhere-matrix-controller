async function communicateWithMatrix(ipAddress: string, path: string) {
    const url = "http://" + ipAddress + path;
    
    // Wait for x milliseconds to receive a response from the matrix before throwing an error.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
        let response = await fetch(url, { signal: controller.signal });
        let data = await response.json();
        
        // A valid response will contain a "Result" key with value true.
        if ( !( "Result" in data ) ) {
            throw new Error("Invalid response from the matrix.")
        }
        if ( data["Result"] !== true ) {
            throw new Error("Result not returned from the matrix.")
        }
        
        return data;
    } catch(err) {
        throw new Error("Unable to communicate with the matrix.")
    }
}


export async function isAlive(ipAddress: string) {
    // Check we can communicate with the matrix and it's in a healthy state.
    let data = await communicateWithMatrix(ipAddress, "/System/Details");
    if ( data["StatusMessage"] !== "Healthy") {
        throw new Error("Matrix is unhealthy and probably needs rebooting.")
    }
}


interface PortInfo {
    Bay: number;
    Mode: string;
    Type: string;
    Status: number;
    Name: string;
}
interface InputPortInfo extends PortInfo {
    Mode: "Input";
}
interface OutputPortInfo extends PortInfo {
    Mode: "Output";
    SinkPowerStatus: number;
}
interface PortList {
    Input: Array<InputPortInfo>;
    Output: Array<OutputPortInfo>;
}

async function getPortList(ipAddress: string) : Promise<PortList> {
    let data = await communicateWithMatrix(ipAddress, "/Port/List");
    let inputPorts: Array<InputPortInfo> = [];
    let outputPorts: Array<OutputPortInfo> = [];
    for ( let port of data["Ports"] ) {
        if ( port.Mode === "Input") {
            inputPorts.push(port);
        } else if ( port.Mode === "Output" ) {
            outputPorts.push(port);
        }
    }
    const listOfPorts = {Input: inputPorts, Output: outputPorts};
    return listOfPorts;
}


export interface ConnectionInfo extends PortList {
    inputToOutputMapping: Map<Number, Array<number>>;
}

export async function getConnectionInfo(ipAddress: string) : Promise<ConnectionInfo> {
    let portDetails = await getPortList(ipAddress);
    let ioMapping = new Map<Number, Array<number>>();
    for ( let inputPortInfo of portDetails.Input ) {
        let bay = inputPortInfo.Bay;
        let inputPortDetails = await communicateWithMatrix(ipAddress, "/Port/Details/Input/" + bay);
        let connectedOutputs = inputPortDetails["TransmissionNodes"];
        ioMapping.set(bay, connectedOutputs);
    }
    const info = {Input: portDetails.Input, Output: portDetails.Output, inputToOutputMapping: ioMapping};
    return info;
}


export async function switchTo(ipAddress: string, inputBay: number, outputBays: Array<number>) : Promise<void> {
    console.log("Switching input " + inputBay + " to outputs " + outputBays);
    for ( let i = 0; i < outputBays.length; i++ ) {
        const path = "/Port/Set/" + inputBay + "/" + outputBays[i];
        await communicateWithMatrix(ipAddress, path);
    }
}