// Function to handle input event and save data
async function handleInputEvent(event, inputElement) {
  if (event.key !== "Enter") return;

  const inputValue = inputElement.value.trim();
  if (!inputValue) return;

  let baseTopicName = "Default";
  let topicName = baseTopicName;

  // Retrieve existing topics from Chrome storage
  chrome.storage.sync.get(null, async function (data) {
    let topics = data || {};
    const uniqueID = await generateUniqueID(topicName);

    // Ensure unique topic name
    while (topics.hasOwnProperty(topicName)) {
      topicName = `${baseTopicName}_${Math.floor(Math.random() * 10000)}`;
    }

    // Create new topic object
    topics[uniqueID] = {
      name: topicName,
      prompts: [inputValue],
    };

    // Save and update UI
    chrome.storage.sync.set(topics, function () {
      console.log(`Gespeichert in ${topicName} (ID: ${uniqueID}):`, inputValue);
      inputElement.value = ""; // Clear input field
      addDropdownItem(uniqueID, topicName);
    });
  });
}

// Function to attach event listeners to input elements
function attachListeners() {
  const copilotInput = document.querySelector(
    "textarea.ChatInputV2-module__input--B2oNx"
  );
  const gitHubInput = document.querySelector(
    "textarea#copilot-dashboard-entrypoint-textarea"
  );

  if (copilotInput && !copilotInput.dataset.listenerAttached) {
    copilotInput.addEventListener("keydown", (event) =>
      handleInputEvent(event, copilotInput)
    );
    copilotInput.dataset.listenerAttached = "true";
  }

  if (gitHubInput && !gitHubInput.dataset.listenerAttached) {
    gitHubInput.addEventListener("keydown", (event) =>
      handleInputEvent(event, gitHubInput)
    );
    gitHubInput.dataset.listenerAttached = "true";
  }
}

// Run the function initially
attachListeners();

// MutationObserver to detect DOM changes and reattach event listeners
const observer = new MutationObserver(() => {
  attachListeners();
});

// Observe changes in the entire body
observer.observe(document.body, { childList: true, subtree: true });

// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

let buttonCounter = 1; // Startwert für auto_increment

setInterval(() => {
  let toolbars = document.querySelectorAll(
    '[role="toolbar"][aria-label="Message tools"]'
  );

  toolbars.forEach((toolbar) => {
    // Überprüfen, ob ein Button existiert, der mit "save-prompt-button-" beginnt
    let buttonExists = Array.from(toolbar.querySelectorAll("button")).some(
      (btn) => btn.className.match(/\bsave-prompt-button-\d+\b/)
    );

    if (!buttonExists) {
      const button = document.createElement("button");
      button.textContent = `Save Prompt`;
      button.classList.add(
        "save-prompt-button",
        `save-prompt-button-${buttonCounter}`
      ); // Allgemeine + spezifische Klasse

      // Button-Styling
      button.style.padding = "5px 10px";
      button.style.marginLeft = "5px";
      button.style.cursor = "pointer";
      button.style.border = "1px solid #ccc";
      button.style.borderRadius = "5px";
      button.style.color = "black";
      button.style.background = "#f0f0f0";
      button.title =
        "If you liked the answer, save the prompt that generated it directly to your memory.";

      // Hover-Effekte
      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "#e0e0e0";
        button.style.borderColor = "#bbb";
      });

      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "#f0f0f0";
        button.style.borderColor = "#ccc";
      });

      // Klick-Event, das überprüft, welcher Button gedrückt wurde
      button.addEventListener("click", (event) => {
        let clickedButton = event.target; // Der geklickte Button
        let match = clickedButton.className.match(/save-prompt-button-(\d+)/); // Zahl aus Klasse extrahieren
        if (match) {
          let buttonNumber = parseInt(match[1], 10); // Zahl in Integer umwandeln
          console.log(`Button ${buttonNumber} wurde geklickt.`);
          promptGrabber(buttonNumber);
        }
      });

      toolbar.appendChild(button);
      buttonCounter++; // Zähler erhöhen
    }
  });
}, 3000); // Alle 3 Sekunden prüfen

// Funktion zum Abrufen des passenden Chat-Elements
function promptGrabber(index) {
  // Überprüfen, ob der Index eine positive Zahl ist
  if (index <= 0) {
    console.error("Index muss eine positive Zahl sein.");
    return;
  }

  // Berechnung des nth-child-Wertes
  const nthChild = index * 2;

  let message = document.querySelector(
    `.ChatMessage-module__chatMessage--rtt38.ChatMessage-module__user--UoWHh:nth-child(${nthChild})`
  );

  if (message) {
    console.log(`Prompt ${index}:`, message.textContent);
  } else {
    console.log(`Kein Element für Prompt ${index} gefunden.`);
  }
}
