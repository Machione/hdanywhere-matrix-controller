import { config } from "./config.js";
import { isAlive, ConnectionInfo, getConnectionInfo, switchTo } from "./matrix.js";
declare const LeaderLine: any;


function getIpAddress() : string {
    // Read the IP Address from the input setting.
    const ipAddressForm = <HTMLInputElement>document.getElementById("ipAddressForm");
    if ( ipAddressForm ) {
        localStorage.setItem("matrixIpAddress", ipAddressForm.value);
    }
    // Update local storage.
    let currentIpAddress = localStorage.getItem("matrixIpAddress");
    if ( currentIpAddress == null ) {
        return config.defaultMatrixIpAddress;
    }
    return currentIpAddress;
}

function errorHandlingPrompt(error: any) {
    // Prompt the user to update the IP address of the matrix.
    let ipAddress = prompt(error + "\nPlease enter the IP address shown on the matrix.", getIpAddress());
    if ( ipAddress == null || ipAddress === "" ) {
        window.location.reload();
    } else {
        localStorage.setItem("matrixIpAddress", ipAddress);
        window.location.reload();
    }
}


function getBayNumber(id: string) : number {
    const bay = id.replace(/[^0-9]/g, "");
    return Number(bay);
}

function getDesiredOutputBays() : Array<number> {
    let checkboxContainers = document.getElementsByClassName("outputCheckboxContainer")
    let bays: Array<number> = [];
    for ( let checkboxContainer of checkboxContainers ) {
        if ( checkboxContainer instanceof HTMLDivElement && checkboxContainer.style.display !== "none" ) {
            let checkbox = <HTMLInputElement>checkboxContainer.getElementsByTagName("input")[0];
            if ( checkbox.checked ) {
                bays.push(getBayNumber(checkbox.id));
            }
        }
    }
    return bays;
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntilSwitched(ipAddress: string, inputBay: number, expectedOutputBays: number[]) {
    try {
        let connectionInfo = await getConnectionInfo(ipAddress);
        let actualOutputBays = connectionInfo.inputToOutputMapping.get(inputBay);
        if ( actualOutputBays == null ) {
            actualOutputBays = [];
        }
        // Ignore any static outputs
        for ( let staticBay of config.staticOutputBays ) {
            let staticBayIndex = actualOutputBays.indexOf(staticBay);
            if ( staticBayIndex >= 0 ) {
                actualOutputBays.splice(staticBayIndex, 1);
            }
        }
        
        for ( let expectedOutputBay of expectedOutputBays ) {
            if ( actualOutputBays.indexOf(expectedOutputBay) === -1 ) {
                await sleep(1000);
                await waitUntilSwitched(ipAddress, inputBay, expectedOutputBays);
            }
        }
    } catch (error) {
        console.error(error);
        errorHandlingPrompt(error);
    }
}


async function clickHandler(event: MouseEvent) {
    turnOnLoading();
    let inputFigure = <HTMLElement>event.currentTarget;
    let inputBay = getBayNumber(inputFigure.id);
    const outputBays = getDesiredOutputBays();
    const ipAddress = getIpAddress();
    if ( outputBays.length > 0 ) {
        try {
            await switchTo(ipAddress, inputBay, outputBays);
            await waitUntilSwitched(ipAddress, inputBay, outputBays);
            // Change the input button colours.
            let inputFigures = document.getElementsByClassName("inputFigure");
            for ( let figure of inputFigures ) {
                if ( figure.id.includes(String(inputBay)) ) {
                    figure.classList.add("activeInput");
                    figure.classList.remove("inactiveInput");
                } else {
                    figure.classList.add("inactiveInput");
                    figure.classList.remove("activeInput");
                }
            }
        } catch (error) {
            console.error(error);
            errorHandlingPrompt(error);
        }
    }
    updateAll();
    turnOffLoading();
}


function updateInputFigures(connectionInfo: ConnectionInfo) : void {
    // Hide all the figures
    let inputFigures = document.getElementsByClassName("inputFigure");
    for ( let i = 0; i < inputFigures.length; i++ ) {
        let button = <HTMLInputElement>inputFigures[i];
        button.style.display = "none";
    }
    
    // Show and update the information on buttons for connected inputs.
    for ( let inputPortInfo of connectionInfo.Input ) {
        let bay = inputPortInfo.Bay;
        let ioMapping = connectionInfo.inputToOutputMapping.get(bay);
        // We should display the button if the input is connected to an output
        // or if a device is plugged into the input
        let buttonVisible = false;
        if ( ioMapping && ioMapping.length > 0 ) {
            buttonVisible = true;
        }
        if ( inputPortInfo.Status === 0 ) {
            buttonVisible = true;
        }
        if ( buttonVisible ) {
            let figureID = "input" + bay + "Figure";
            let figure = document.getElementById(figureID);
            if ( figure ) {
                figure.style.display = "block";
                let caption = figure.getElementsByTagName("figcaption")[0];
                caption.textContent = inputPortInfo.Name;
                let image = <HTMLImageElement>figure.getElementsByTagName("img")[0];
                if ( inputPortInfo.Status === 0 ) {
                    image.src = "./img/connected.png";
                    image.alt = "connected";
                    figure.classList.remove("disconnectedInput");
                    figure.classList.add("connectedInput");
                } else {
                    image.src = "./img/disconnected.png";
                    image.alt = "disconnected";
                    figure.classList.remove("connectedInput");
                    figure.classList.add("disconnectedInput");
                }
            }
        }
    }
}

function updateOutputFiguresAndCheckboxes(connectionInfo: ConnectionInfo) : void {
    // Hide all figures
    let outputFigures = document.getElementsByClassName("outputFigure");
    for ( let i = 0; i < outputFigures.length; i++ ) {
        let figure = <HTMLElement>outputFigures[i];
        figure.style.display = "none";
    }
    // Disable all checkboxes
    let outputCheckboxes = document.getElementsByClassName("outputCheckboxContainer");
    for ( let i = 0; i < outputCheckboxes.length; i++ ) {
        let outputCheckboxDiv = <HTMLDivElement>outputCheckboxes[i];
        outputCheckboxDiv.style.display = "none";
    }
    // Hide the static output information
    let staticOutputInfo = document.getElementById("staticOutputInfo");
    if ( staticOutputInfo ) {
        staticOutputInfo.style.display = "none";
        let staticOutputList = staticOutputInfo.getElementsByTagName("ul")[0];
        staticOutputList.innerHTML = "";
    }
    
    // Update the information on outputs
    for ( let outputPortInfo of connectionInfo.Output ) {
        let bay = outputPortInfo.Bay;
        let figureID = "output" + bay + "Figure";
        let figure = document.getElementById(figureID);
        
        // Make this output figure visible, update text and image
        if ( figure ) {
            figure.style.display = "block";
            let caption = figure.getElementsByTagName("figcaption")[0];
            caption.textContent = outputPortInfo.Name;
            let image = <HTMLImageElement>figure.getElementsByTagName("img")[0];
            if ( config.staticOutputBays.indexOf(bay) >= 0 ) {
                image.src = "./img/static.png";
                image.alt = "static";
                figure.classList.remove("disconnectedOutput");
                figure.classList.remove("connectedOutput");
                figure.classList.add("staticOutput");
            } else if ( outputPortInfo.Status === 0 ) {
                image.src = "./img/connected.png";
                image.alt = "connected";
                figure.classList.remove("disconnectedOutput");
                figure.classList.remove("staticOutput");
                figure.classList.add("connectedOutput");
            } else {
                image.src = "./img/disconnected.png";
                image.alt = "disconnected";
                figure.classList.remove("connectedOutput");
                figure.classList.remove("staticOutput");
                figure.classList.add("disconnectedOutput");
            }
        }
        
        // Update the checkboxes and static port info in the advanced settings
        if ( config.staticOutputBays.indexOf(bay) >= 0 ) {
            let staticOutputInfo = document.getElementById("staticOutputInfo");
            if ( staticOutputInfo ) {
                staticOutputInfo.style.display = "block";
                let staticOutputList = staticOutputInfo.getElementsByTagName("ul")[0];
                let staticOutputListItem = document.createElement("li");
                staticOutputListItem.textContent = outputPortInfo.Name;
                staticOutputList.appendChild(staticOutputListItem); 
            }
        } else {
            let checkboxContainerID = "output" + bay + "CheckboxContainer";
            let checkboxContainer = document.getElementById(checkboxContainerID);
            if ( checkboxContainer ) {
                checkboxContainer.style.display = "block";
                let label = checkboxContainer.getElementsByTagName("label")[0];
                label.textContent = outputPortInfo.Name;
            }
        }
    }
    
}

let connectionLines = new Array<any>();

function updateConnectionLines(connectionInfo: ConnectionInfo) : void {
    // Hide all existing lines
    for ( let line of connectionLines ) {
        line.hide();
        line.remove();
    }
    connectionLines = [];
    const lineColours = ["#3B5AA5", "#192747", "#879ED4", "#22345E", "#6986C9", "#2A4176", "#4B6EBE", "#334E8D"];
    
    let maxLineSpread = 70; // Max vertical distance the lines can be spread apart, in units of LeaderLine gravity.
    let maxNumberInputs = 8;
    let lineSpreadDistance = maxLineSpread / (maxNumberInputs - 1);
    
    let indexVisibleInputFigure = 0;
    for ( let [inputBay, connectedOutputBays] of connectionInfo.inputToOutputMapping ) {
        let inputFigureID = "input" + inputBay + "Figure";
        let inputFigure = document.getElementById(inputFigureID);
        
        if ( inputFigure && inputFigure.style.display !== "none" ) {
            let distanceFromMidpoint = 5;
            distanceFromMidpoint += (Math.floor(indexVisibleInputFigure / 2)) * lineSpreadDistance;
            let gravity = (maxLineSpread / 2) + distanceFromMidpoint; 
            if ( indexVisibleInputFigure % 2 === 0 ) {
                // Move above the midpoint
                gravity = (maxLineSpread / 2) - distanceFromMidpoint; 
            }
            
            // Draw the static output connections first (behind all others)
            let displayOrderConnectedOutputs = new Array<number>();
            for ( let connectedOutputBay of connectedOutputBays ) {
                if ( config.staticOutputBays.indexOf(connectedOutputBay) >= 0 ) {
                    displayOrderConnectedOutputs.push(connectedOutputBay);
                }
            }
            for ( let connectedOutputBay of connectedOutputBays ) {
                if ( config.staticOutputBays.indexOf(connectedOutputBay) < 0 ) {
                    displayOrderConnectedOutputs.push(connectedOutputBay);
                }
            }
            
            for ( let connectedOutputBay of displayOrderConnectedOutputs ) {
                let connectedOutputID = "output" + connectedOutputBay + "Figure";
                let connectedOutput = document.getElementById(connectedOutputID);
                let colour = lineColours[indexVisibleInputFigure];
                if ( connectedOutput && connectedOutput.classList.contains("staticOutput") ) {
                    colour = "#888b93";
                }
                let line = new LeaderLine(
                    inputFigure,
                    connectedOutput,
                    {
                        dash: {animation: true}, 
                        color: colour,
                        path: "grid", 
                        startSocket: "bottom", 
                        endSocket: "top", 
                        startSocketGravity: gravity,
                        endSocketGravity: maxLineSpread - gravity
                    }
                );
                connectionLines.push(line);
            }
            indexVisibleInputFigure++;
        }
    }
}


function enableClicks() : void {
    // Add click handlers to all the input figures
    let inputFigures = document.getElementsByClassName("inputFigure");
    for ( let inputFigure of inputFigures ) {
        let inputFigureHTML = <HTMLElement>inputFigure;
        inputFigureHTML.addEventListener("click", clickHandler);
    }
}

function disableClicks() : void {
    // Remove click handlers from all the input figures
    let inputFigures = document.getElementsByClassName("inputFigure");
    for ( let inputFigure of inputFigures ) {
        let inputFigureHTML = <HTMLElement>inputFigure;
        inputFigureHTML.removeEventListener("click", clickHandler);
    }
}

function turnOnLoading() : void {
    disableClicks();
    let dimmer = <HTMLDivElement>document.getElementById("dim");
    dimmer.style.visibility = "visible";
    let loader = <HTMLDivElement>document.getElementsByClassName("loading")[0];
    loader.style.visibility = "visible";
}

function turnOffLoading() : void {
    let dimmer = <HTMLDivElement>document.getElementById("dim");
    dimmer.style.visibility = "hidden";
    let loader = <HTMLDivElement>document.getElementsByClassName("loading")[0];
    loader.style.visibility = "hidden";
    enableClicks();
}


export async function updateAll() {
    let matrixIpAddress = getIpAddress();
    try {
        await isAlive(matrixIpAddress);
        let connectionInfo = await getConnectionInfo(matrixIpAddress);
        updateInputFigures(connectionInfo);
        updateOutputFiguresAndCheckboxes(connectionInfo);
        updateConnectionLines(connectionInfo);
    } catch (error) {
        console.error(error);
        errorHandlingPrompt(error);
    }
}


export function init() : void {
    
    // Use the default matrix IP address if one hasn't been set yet.
    if ( localStorage.getItem("matrixIpAddress") == null ) {
        localStorage.setItem("matrixIpAddress", config.defaultMatrixIpAddress);
    }
    
    // Update the IP address input to the local storage value.
    const ipAddressForm = <HTMLInputElement>document.getElementById("ipAddressForm");
    if ( ipAddressForm ) {
        let currentIpAddress = localStorage.getItem("matrixIpAddress");
        if ( currentIpAddress == null ) {
            currentIpAddress = config.defaultMatrixIpAddress;
        }
        ipAddressForm.value = currentIpAddress;
    }
    
    enableClicks();
    let dimmer = <HTMLDivElement>document.getElementById("dim");
    dimmer.style.visibility = "hidden";
    let loader = <HTMLDivElement>document.getElementsByClassName("loading")[0];
    loader.style.visibility = "hidden";
}
