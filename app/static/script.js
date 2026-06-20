const form = document.getElementById("prediction-form");
form.setAttribute("novalidate", "true");
const inputGrid = document.getElementById("input-grid");

const resultBox = document.getElementById("result");
const emptyState = document.getElementById("empty-state");

const predictedClassEl = document.getElementById("predicted-class");
const confidenceEl = document.getElementById("confidence");
const probabilitiesEl = document.getElementById("probabilities");
const profileEl = document.getElementById("profile");
const habitabilityNoteEl = document.getElementById("habitability-note");
const fillSampleBtn = document.getElementById("fill-sample");
const classGuideCarousel = document.getElementById("class-guide-carousel");

const classVisualEl = document.getElementById("class-visual");
const classTitleEl = document.getElementById("class-title");
const classSubtitleEl = document.getElementById("class-subtitle");
const classDescriptionEl = document.getElementById("class-description");

let uiConfig = {};
let currentInput = {};

const markerEnabledFeatures = new Set([
  "planet_radius_earth",
  "planet_mass_earth",
  "orbital_period_days",
  "semi_major_axis_au",
  "equilibrium_temp_k"
]);

async function loadUIConfig() {
  const response = await fetch("/api/ui-config");
  uiConfig = await response.json();

  Object.entries(uiConfig).forEach(([feature, config]) => {
    currentInput[feature] = config.default;
  });

  renderClassGuideCarousel();
  renderInputControls();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalize(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}
function parseNumericValue(rawValue, fallback = 0) {
  const normalized = String(rawValue).trim().replace(",", ".");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}
function valueToSliderPosition(value, config) {
  const min = Number(config.min);
  const max = Number(config.max);
  const numericValue = clamp(Number(value), min, max);

  if (config.scale === "log" && min > 0 && max > min) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logValue = Math.log10(Math.max(numericValue, min));

    return ((logValue - logMin) / (logMax - logMin)) * 100;
  }

  return normalize(numericValue, min, max) * 100;
}

function sliderPositionToValue(position, config) {
  const min = Number(config.min);
  const max = Number(config.max);
  const sliderPosition = clamp(Number(position), 0, 100);

  if (config.scale === "log" && min > 0 && max > min) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logValue = logMin + (sliderPosition / 100) * (logMax - logMin);

    return Math.pow(10, logValue);
  }

  return min + (sliderPosition / 100) * (max - min);
}

function formatFeatureValue(value, config) {
  const number = Number(value);

  if (Number.isNaN(number)) return "";

  if (config.step === 1 || Number.isInteger(number)) {
    return String(Math.round(number));
  }

  const absValue = Math.abs(number);

  if (absValue >= 100) return String(Number(number.toFixed(2)));
  if (absValue >= 10) return String(Number(number.toFixed(3)));
  if (absValue >= 1) return String(Number(number.toFixed(4)));

  return String(Number(number.toFixed(5)));
}

function shortClassName(className) {
  const shortNames = {
    "Sub-Earth": "Sub",
    "Super-Earth": "S-Earth",
    "Mini-Neptune": "Mini",
    "Neptune-like": "Nep",
    "Gas Giant": "Gas",
    "Super-Jupiter": "S-Jup"
  };

  return shortNames[className] || className;
}

function renderClassMarkers(feature, config) {
  if (!markerEnabledFeatures.has(feature)) return "";
  if (!config.class_markers) return "";

  const markers = Object.entries(config.class_markers)
    .map(([className, markerValue]) => {
      const markerPosition = valueToSliderPosition(markerValue, config);
      const safePosition = clamp(markerPosition, 0, 100);

      return {
        className,
        markerValue,
        position: safePosition
      };
    })
    .sort((a, b) => a.position - b.position);

  let lastLabelPosition = -999;

  const markerHTML = markers
    .map((marker) => {
      const showLabel = marker.position - lastLabelPosition > 8;

      if (showLabel) {
        lastLabelPosition = marker.position;
      }

      return `
        <span 
          class="class-marker" 
          style="left:${marker.position}%"
          title="${marker.className}: ${formatFeatureValue(marker.markerValue, config)} ${config.unit || ""}"
        >
          <span class="class-marker-dot"></span>
          ${
            showLabel
              ? `<span class="class-marker-label">${shortClassName(marker.className)}</span>`
              : ""
          }
        </span>
      `;
    })
    .join("");

  return `<div class="class-marker-row">${markerHTML}</div>`;
}

function renderMiniVisual(feature, config, value) {
  const visualType = config.visual_type;
  const min = Number(config.min);
  const max = Number(config.max);
  const ratio = clamp(normalize(Number(value), min, max), 0, 1);

  if (visualType === "stars") {
    const count = Math.round(Number(value));
    return `
      <div class="visual visual-stars">
        ${Array.from({ length: count }, (_, i) => `<span class="star star-${i}">✦</span>`).join("")}
      </div>
    `;
  }

  if (visualType === "planet_count") {
    const count = Math.round(Number(value));
    return `
      <div class="visual visual-planet-count">
        <div class="mini-sun"></div>
        ${Array.from({ length: count }, (_, i) => {
          const angle = (360 / Math.max(count, 1)) * i;
          return `<span class="mini-planet" style="--angle:${angle}deg"></span>`;
        }).join("")}
      </div>
    `;
  }

  if (visualType === "orbit_speed" || visualType === "orbit_distance") {
    const duration = 1 + ratio * 8;
    const orbitSize = 60 + ratio * 55;

    return `
      <div class="visual visual-orbit">
        <div class="orbit" style="width:${orbitSize}px;height:${orbitSize}px;">
          <div class="orbiting-planet" style="animation-duration:${duration}s;"></div>
        </div>
        <div class="mini-sun center"></div>
      </div>
    `;
  }

  if (visualType === "planet_radius") {
    const size = 28 + ratio * 72;

    return `
      <div class="visual visual-radius">
        <div class="earth-ref"></div>
        <div class="radius-planet" style="width:${size}px;height:${size}px;"></div>
      </div>
    `;
  }

  if (visualType === "thermometer") {
    const fillHeight = Math.round(ratio * 100);

    return `
      <div class="visual visual-thermometer">
        <div class="thermo">
          <div class="thermo-fill" style="height:${fillHeight}%"></div>
        </div>
        <span>${Math.round(value)} K</span>
      </div>
    `;
  }

  if (visualType === "eccentricity_orbit") {
    const scaleY = 1 - ratio * 0.55;

    return `
      <div class="visual visual-eccentricity">
        <div class="ellipse-orbit" style="transform:scaleY(${scaleY});"></div>
        <div class="mini-sun center"></div>
      </div>
    `;
  }

  if (visualType === "star_temperature" || visualType === "star_radius" || visualType === "star_mass") {
    const size = 34 + ratio * 68;
    const hue = 210 - ratio * 170;

    return `
      <div class="visual visual-star">
        <div class="big-star" style="width:${size}px;height:${size}px;background:hsl(${hue}, 90%, 62%);"></div>
      </div>
    `;
  }

  return `
    <div class="visual visual-gauge">
      <div class="gauge-fill" style="width:${ratio * 100}%"></div>
    </div>
  `;
}

function renderInputControls() {
  inputGrid.innerHTML = "";

  Object.entries(uiConfig).forEach(([feature, config]) => {
    const value = currentInput[feature];

    const card = document.createElement("div");
    card.className = "feature-card";
    card.dataset.feature = feature;

    const sliderValue = valueToSliderPosition(value, config);
    const formattedValue = formatFeatureValue(value, config);

    card.innerHTML = `
      <div class="feature-visual">
        ${renderMiniVisual(feature, config, value)}
      </div>

      <div class="feature-info">
        <div class="feature-top">
          <label>${config.label}</label>
          <span>${config.unit || ""}</span>
        </div>

        <p>${config.description}</p>

        <div class="control-row">
          <div class="range-zone">
            <input
              class="range-input"
              type="range"
              min="0"
              max="100"
              step="0.1"
              value="${sliderValue}"
              data-feature="${feature}"
            />

            ${renderClassMarkers(feature, config)}
          </div>

          <input
            class="number-input"
            type="text"
            inputmode="decimal"
            value="${formattedValue}"
            data-feature="${feature}"
          />
        </div>

        <div class="range-meta">
          <span>${formatFeatureValue(config.min, config)}</span>
          <strong>${formattedValue}</strong>
          <span>${formatFeatureValue(config.max, config)}</span>
        </div>
      </div>
    `;

    inputGrid.appendChild(card);
  });

  bindInputEvents();
}

function updateFeatureValue(feature, rawValue, inputSource = "number") {
  const config = uiConfig[feature];

  let parsedValue;

  if (inputSource === "slider") {
    const sliderPosition = parseNumericValue(rawValue, 0);
    parsedValue = sliderPositionToValue(sliderPosition, config);
  } else {
    parsedValue = parseNumericValue(rawValue, currentInput[feature]);
  }

  const value = clamp(parsedValue, Number(config.min), Number(config.max));
  const formattedValue = formatFeatureValue(value, config);

  currentInput[feature] = value;

  const card = document.querySelector(`.feature-card[data-feature="${feature}"]`);
  if (!card) return;

  const range = card.querySelector(".range-input");
  const number = card.querySelector(".number-input");
  const centerValue = card.querySelector(".range-meta strong");
  const visualBox = card.querySelector(".feature-visual");

  range.value = valueToSliderPosition(value, config);
  number.value = formattedValue;
  centerValue.textContent = formattedValue;
  visualBox.innerHTML = renderMiniVisual(feature, config, value);
}

function bindInputEvents() {
  const rangeInputs = inputGrid.querySelectorAll(".range-input");
  const numberInputs = inputGrid.querySelectorAll(".number-input");

  rangeInputs.forEach((input) => {
    input.addEventListener("input", (event) => {
      const feature = event.target.dataset.feature;
      updateFeatureValue(feature, event.target.value, "slider");
    });
  });

  numberInputs.forEach((input) => {
    input.addEventListener("change", (event) => {
      const feature = event.target.dataset.feature;
      updateFeatureValue(feature, event.target.value, "number");
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const feature = event.target.dataset.feature;
        updateFeatureValue(feature, event.target.value, "number");
      }
    });
  });
}

fillSampleBtn.addEventListener("click", () => {
  Object.entries(uiConfig).forEach(([feature, config]) => {
    updateFeatureValue(feature, config.default);
  });
});

function getFormData() {
  const data = {};

  Object.entries(currentInput).forEach(([key, value]) => {
    data[key] = parseNumericValue(value, null);
  });

  return data;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function renderProbabilities(probabilities) {
  probabilitiesEl.innerHTML = "";

  const sorted = Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1]);

  sorted.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "prob-row";

    row.innerHTML = `
      <div class="prob-top">
        <span>${label}</span>
        <strong>${formatPercent(value)}</strong>
      </div>
      <div class="bar">
        <div class="bar-fill" style="width: ${value * 100}%"></div>
      </div>
    `;

    probabilitiesEl.appendChild(row);
  });
}

function renderProfile(profile) {
  if (!profile) {
    profileEl.innerHTML = `<div class="profile-item">No profile information available.</div>`;
    return;
  }

  profileEl.innerHTML = `
    <div class="profile-item"><span>Typical radius</span>${profile.planet_radius_earth} × Earth</div>
    <div class="profile-item"><span>Typical mass</span>${profile.planet_mass_earth} × Earth</div>
    <div class="profile-item"><span>Median temperature</span>${profile.equilibrium_temp_k} K</div>
    <div class="profile-item"><span>Orbital period</span>${Number(profile.orbital_period_days).toFixed(2)} days</div>
    <div class="profile-item"><span>Distance from star</span>${profile.semi_major_axis_au} AU</div>
    <div class="profile-item"><span>Comment</span>${profile.tipik_yorum}</div>
  `;
}

function renderHabitabilityNote(inputData) {
  const temp = inputData.equilibrium_temp_k;

  if (temp === null || Number.isNaN(temp)) {
    habitabilityNoteEl.textContent =
      "Equilibrium temperature was not provided, so the estimated habitable temperature note cannot be calculated.";
    return;
  }

  if (temp >= 200 && temp <= 400) {
    habitabilityNoteEl.textContent =
      `The equilibrium temperature is ${temp} K, which is inside the rough 200K–400K habitable temperature band. This does not guarantee real habitability.`;
  } else {
    habitabilityNoteEl.textContent =
      `The equilibrium temperature is ${temp} K, which is outside the rough 200K–400K habitable temperature band. This suggests a less Earth-like thermal profile.`;
  }
}

const classVisualMap = {
  "Sub-Earth": {
    title: "Sub-Earth",
    subtitle: "Small rocky planet",
    description:
      "Smaller than Earth, usually represented by low radius and low mass values. In this dataset, it is close to the lower end of the planet-size range.",
    visualClass: "sub-earth",
    howTo:
      "Lower the planet radius below Earth-like values and keep the planet mass relatively low.",
    preset: {
      n_stars: 1,
      n_planets: 1,
      orbital_period_days: 3.916,
      planet_radius_earth: 0.84,
      planet_mass_earth: 0.615,
      equilibrium_temp_k: 994.5,
      orbital_eccentricity: 0,
      semi_major_axis_au: 0.046,
      star_temp_k: 5546,
      star_radius_sun: 0.95,
      star_mass_sun: 0.94,
      star_age_gyr: 3.98,
      star_surface_gravity: 4.453,
      star_metallicity: 0.02,
      dist_from_earth_pc: 376.658
    }
  },

  "Super-Earth": {
    title: "Super-Earth",
    subtitle: "Large rocky / terrestrial-like planet",
    description:
      "Larger than Earth but still far smaller than gas giants. Often separated from Sub-Earth mostly by radius and mass.",
    visualClass: "super-earth",
    howTo:
      "Use a radius around 1–2 Earth radii and a moderate mass. Keep it below Mini-Neptune and gas giant ranges.",
    preset: {
      n_stars: 1,
      n_planets: 1,
      orbital_period_days: 5.342,
      planet_radius_earth: 1.4,
      planet_mass_earth: 2.6,
      equilibrium_temp_k: 923,
      orbital_eccentricity: 0.02,
      semi_major_axis_au: 0.057,
      star_temp_k: 5546,
      star_radius_sun: 0.95,
      star_mass_sun: 0.94,
      star_age_gyr: 3.98,
      star_surface_gravity: 4.453,
      star_metallicity: 0.02,
      dist_from_earth_pc: 376.658
    }
  },

  "Mini-Neptune": {
    title: "Mini-Neptune",
    subtitle: "Small atmospheric planet",
    description:
      "Larger than Super-Earth and likely closer to an atmosphere-rich planet profile. It sits between rocky planets and Neptune-like worlds.",
    visualClass: "mini-neptune",
    howTo:
      "Increase radius and mass above Super-Earth values, but keep them below Neptune-like or gas giant ranges.",
    preset: {
      n_stars: 1,
      n_planets: 1,
      orbital_period_days: 13.767,
      planet_radius_earth: 2.46,
      planet_mass_earth: 6.85,
      equilibrium_temp_k: 678,
      orbital_eccentricity: 0.02,
      semi_major_axis_au: 0.11,
      star_temp_k: 5546,
      star_radius_sun: 0.95,
      star_mass_sun: 0.94,
      star_age_gyr: 3.98,
      star_surface_gravity: 4.453,
      star_metallicity: 0.02,
      dist_from_earth_pc: 376.658
    }
  },

  "Neptune-like": {
    title: "Neptune-like",
    subtitle: "Neptune-sized planet",
    description:
      "A larger and heavier planet profile compared with Mini-Neptune. It usually has a stronger radius and mass signal.",
    visualClass: "neptune-like",
    howTo:
      "Move radius and mass above Mini-Neptune values. This class often appears when the planet becomes clearly larger and heavier.",
    preset: {
      n_stars: 1,
      n_planets: 1,
      orbital_period_days: 19.497,
      planet_radius_earth: 4.19,
      planet_mass_earth: 16.35,
      equilibrium_temp_k: 707.5,
      orbital_eccentricity: 0.02,
      semi_major_axis_au: 0.159,
      star_temp_k: 5546,
      star_radius_sun: 0.95,
      star_mass_sun: 0.94,
      star_age_gyr: 3.98,
      star_surface_gravity: 4.453,
      star_metallicity: 0.02,
      dist_from_earth_pc: 376.658
    }
  },

  "Gas Giant": {
    title: "Gas Giant",
    subtitle: "Large gaseous planet",
    description:
      "A large-radius, high-mass planet profile. Gas giants are typically dominated by thick gaseous envelopes rather than rocky surfaces.",
    visualClass: "gas-giant",
    howTo:
      "Increase planet radius and planet mass strongly. Gas Giant predictions usually appear far above Super-Earth and Mini-Neptune ranges.",
    preset: {
      n_stars: 1,
      n_planets: 1,
      orbital_period_days: 127.707,
      planet_radius_earth: 12.6,
      planet_mass_earth: 458.628,
      equilibrium_temp_k: 1055,
      orbital_eccentricity: 0.05,
      semi_major_axis_au: 0.843,
      star_temp_k: 5546,
      star_radius_sun: 0.95,
      star_mass_sun: 0.94,
      star_age_gyr: 3.98,
      star_surface_gravity: 4.453,
      star_metallicity: 0.02,
      dist_from_earth_pc: 376.658
    }
  },

  "Super-Jupiter": {
    title: "Super-Jupiter",
    subtitle: "Extreme giant planet",
    description:
      "An extreme giant-planet profile. It is related to gas giants but represents a more massive or more extreme giant class.",
    visualClass: "super-jupiter",
    howTo:
      "Use very high mass and large radius values. This class can be hard to reach if the UI slider range does not include extreme values.",
    preset: {
      n_stars: 1,
      n_planets: 1,
      orbital_period_days: 3.446,
      planet_radius_earth: 15.984,
      planet_mass_earth: 325.292,
      equilibrium_temp_k: 1700,
      orbital_eccentricity: 0.05,
      semi_major_axis_au: 0.049,
      star_temp_k: 5546,
      star_radius_sun: 0.95,
      star_mass_sun: 0.94,
      star_age_gyr: 3.98,
      star_surface_gravity: 4.453,
      star_metallicity: 0.02,
      dist_from_earth_pc: 376.658
    }
  }
};

function renderClassVisual(predictedClass) {
  const config = classVisualMap[predictedClass] || {
    title: predictedClass,
    subtitle: "Exoplanet class",
    description:
      "A predicted exoplanet class based on the input physical and orbital features.",
    visualClass: "default-planet"
  };

  classVisualEl.className = `class-visual ${config.visualClass}`;

  classVisualEl.innerHTML = `
    <div class="class-planet">
      <span class="planet-band band-1"></span>
      <span class="planet-band band-2"></span>
      <span class="planet-band band-3"></span>
      <span class="planet-storm"></span>
      <span class="planet-ring"></span>
      <span class="planet-surface surface-1"></span>
      <span class="planet-surface surface-2"></span>
    </div>
  `;

  classTitleEl.textContent = config.title;
  classSubtitleEl.textContent = config.subtitle;
  classDescriptionEl.textContent = config.description;
}
function getClassPlanetHTML(visualClass) {
  return `
    <div class="class-visual ${visualClass} guide-visual">
      <div class="class-planet">
        <span class="planet-band band-1"></span>
        <span class="planet-band band-2"></span>
        <span class="planet-band band-3"></span>
        <span class="planet-storm"></span>
        <span class="planet-ring"></span>
        <span class="planet-surface surface-1"></span>
        <span class="planet-surface surface-2"></span>
      </div>
    </div>
  `;
}

function renderClassGuideCarousel() {
  if (!classGuideCarousel) return;

  classGuideCarousel.innerHTML = "";

  Object.entries(classVisualMap).forEach(([className, config]) => {
    const card = document.createElement("article");
    card.className = "class-guide-card";

    card.innerHTML = `
      ${getClassPlanetHTML(config.visualClass)}

      <div class="class-guide-content">
        <p>${config.subtitle}</p>
        <h3>${config.title}</h3>
        <span>${config.description}</span>

        <div class="how-to-box">
          <strong>How to reach this class</strong>
          <small>${config.howTo}</small>
        </div>

        <button type="button" class="preset-btn" data-class="${className}">
          Apply preset
        </button>
      </div>
    `;

    classGuideCarousel.appendChild(card);
  });

  bindPresetButtons();
}

function applyClassPreset(className) {
  const config = classVisualMap[className];

  if (!config || !config.preset) return;

  Object.entries(uiConfig).forEach(([feature, featureConfig]) => {
    const presetValue =
      config.preset[feature] !== undefined
        ? config.preset[feature]
        : featureConfig.default;

    updateFeatureValue(feature, presetValue);
  });
}

function bindPresetButtons() {
  const buttons = document.querySelectorAll(".preset-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const className = button.dataset.class;
      applyClassPreset(className);

      const formPanel = document.getElementById("prediction-form");
      if (formPanel) {
        formPanel.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const inputData = getFormData();

  const response = await fetch("/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(inputData)
  });

  if (!response.ok) {
    alert("Prediction failed. Please check the input values.");
    return;
  }

  const data = await response.json();

  emptyState.classList.add("hidden");
  resultBox.classList.remove("hidden");

  predictedClassEl.textContent = data.predicted_planet_type;
  confidenceEl.textContent = `Confidence: ${formatPercent(data.confidence)}`;
  renderClassVisual(data.predicted_planet_type);

  renderProbabilities(data.probabilities);
  renderProfile(data.typical_profile);
  renderHabitabilityNote(inputData);
});

loadUIConfig();