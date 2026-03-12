document.addEventListener('DOMContentLoaded', () => {
    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Initialize Chart.js
    const ctx = document.getElementById('complianceChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [
                    {
                        label: 'Compliance %',
                        data: [30, 25, 35, 28, 45, 35, 65, 55, 60, 36, 40, 52],
                        borderColor: '#0284c7', /* var(--clr-blue) */
                        backgroundColor: 'rgba(2, 132, 199, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#0284c7',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Prescriptions',
                        data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45],
                        borderColor: '#818cf8',
                        backgroundColor: 'rgba(129, 140, 248, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#818cf8',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'start',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 20,
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#ffffff',
                        titleColor: '#0f172a',
                        bodyColor: '#64748b',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 10,
                        boxPadding: 4
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: '#e2e8f0',
                            drawBorder: false,
                            borderDash: [5, 5]
                        },
                        ticks: {
                            color: '#64748b',
                            stepSize: 20,
                            font: {
                                size: 12
                            }
                        },
                        min: 0,
                        max: 100
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        // Make Chart Options functional
        const chartOptions = document.querySelectorAll('.chart-options button');
        chartOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                chartOptions.forEach(b => b.classList.remove('active'));
                const target = e.target;
                target.classList.add('active');

                const chartArea = Chart.getChart(ctx);
                if (!chartArea) return;

                if (target.textContent === 'Day') {
                    chartArea.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    chartArea.data.datasets[0].data = [80, 85, 90, 85, 95, 90, 100];
                    chartArea.data.datasets[1].data = [2, 1, 3, 2, 4, 3, 5];
                } else if (target.textContent === 'Week') {
                    chartArea.data.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                    chartArea.data.datasets[0].data = [75, 80, 85, 90];
                    chartArea.data.datasets[1].data = [10, 15, 12, 18];
                } else {
                    chartArea.data.labels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
                    chartArea.data.datasets[0].data = [30, 25, 35, 28, 45, 35, 65, 55, 60, 36, 40, 52];
                    chartArea.data.datasets[1].data = [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45];
                }
                chartArea.update();
            });
        });
    }

    // Identify current page based on URL to apply correct active state logic
    const currentPath = window.location.pathname;

    // Hide chart and top stats if not on dashboard page
    const statsGrid = document.querySelector('.stats-grid');
    const chartPanel = document.querySelector('.chart-panel');

    if (currentPath !== '/' && currentPath !== '/dashboard' && currentPath !== '/index.html') {
        if (statsGrid) statsGrid.style.display = 'none';
        if (chartPanel) chartPanel.style.display = 'none';

        // Hide generator if not on dashboard
        const schedulePanel = document.querySelector('.schedule-panel');
        if (schedulePanel) schedulePanel.style.display = 'none';
    }

    // Handle Upload Simulation
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadResult = document.getElementById('upload-result');
    const extractedList = document.getElementById('extracted-medicines');

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    function handleUpload(file) {
        uploadArea.innerHTML = '<i class="fa-solid fa-spinner fa-spin upload-icon"></i><p>Extracting medicines...</p>';

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload_prescription', {
            method: 'POST',
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to process image');
            }
            return data;
        })
        .then(data => {
            uploadArea.classList.add('hidden');
            uploadResult.classList.remove('hidden');

            const results = data.medicines;

            extractedList.innerHTML = results.map(item =>
                `<li>
                    <span><strong>${item.name}</strong> - ${item.purpose}</span>
                    <span class="badge-time">${item.time}</span>
                </li>`
            ).join('');

            // Allow resetting
            const resetBtn = document.createElement('button');
            resetBtn.className = 'btn-primary';
            resetBtn.style.marginTop = '1rem';
            resetBtn.textContent = 'Upload Another';
            resetBtn.onclick = () => {
                uploadArea.classList.remove('hidden');
                uploadResult.classList.add('hidden');
                uploadArea.innerHTML = '<i class="fa-solid fa-cloud-arrow-up upload-icon"></i><p>Click or drag image to upload and extract medicines</p>';
                fileInput.value = '';
            };
            uploadResult.appendChild(resetBtn);
            
            // Auto populate the prompt with the extracted medicines to make generating the schedule easier
            const names = results.map(r => r.name).join(', ');
            instructionInput.value = `Please create a schedule for: ${names}`;
        })
        .catch(err => {
            console.error("Upload error: ", err);
            // Revert the upload area and show an error alert
            uploadArea.innerHTML = '<i class="fa-solid fa-cloud-arrow-up upload-icon"></i><p>Click or drag image to upload and extract medicines</p>';
            fileInput.value = '';
            alert(err.message || 'An error occurred while reading the document.');
        });
    }

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleUpload(fileInput.files[0]);
        }
    });

    // Voice Input Simulation
    const voiceBtn = document.getElementById('voice-btn');
    const instructionInput = document.getElementById('instruction-input');

    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('recording')) {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        } else {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            instructionInput.placeholder = "Listening...";

            // Simulating speech to text
            setTimeout(() => {
                if (voiceBtn.classList.contains('recording')) {
                    voiceBtn.classList.remove('recording');
                    voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                    instructionInput.value = "Take Paracetamol in the morning, Amoxicillin in the afternoon, and Vitamin D at night before bed.";
                }
            }, 3000);
        }
    });

    // Generate Schedule Simulation
    const generateBtn = document.getElementById('generate-btn');
    const generatedSchedule = document.getElementById('generated-schedule');
    const morningList = document.getElementById('morning-list');
    const afternoonList = document.getElementById('afternoon-list');
    const nightList = document.getElementById('night-list');
    const scheduleLang = document.getElementById('schedule-lang');

    const scheduleTranslations = {
        en: {
            morning: "Paracetamol (500mg) after breakfast",
            afternoon: "Amoxicillin (250mg) after lunch",
            night: "Vitamin D (1000 IU) before sleep"
        },
        hi: {
            morning: "नाश्ते के बाद पैरासिटामोल (500mg)",
            afternoon: "दोपहर के खाने के बाद अमोक्सिसिलिन (250mg)",
            night: "सोने से पहले विटामिन डी (1000 IU)"
        },
        kn: {
            morning: "ತಿಂಡಿಯ ನಂತರ ಪ್ಯಾರೆಸಿಟಮಾಲ್ (500mg)",
            afternoon: "ಊಟದ ನಂತರ ಅಮಾಕ್ಸಿಸಿಲಿನ್ (250mg)",
            night: "ಮಲಗುವ ಮುನ್ನ ವಿಟಮಿನ್ ಡಿ (1000 IU)"
        }
    };

    generateBtn.addEventListener('click', () => {
        if (!instructionInput.value.trim()) {
            instructionInput.value = "Take Paracetamol in the morning, Amoxicillin in the afternoon, and Vitamin D at night.";
        }

        const btnOriginalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

        fetch('/generate_schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instructions: instructionInput.value })
        })
            .then(response => response.json())
            .then(data => {
                const formatList = (arr) => arr && arr.length > 0 ? arr.map(item => `<li>${item}</li>`).join('') : '<li style="color:#94a3b8;">None</li>';

                morningList.innerHTML = formatList(data.morning);
                afternoonList.innerHTML = formatList(data.afternoon || []);
                nightList.innerHTML = formatList(data.night || []);

                generatedSchedule.classList.remove('hidden');
                generateBtn.innerHTML = btnOriginalText;

                // Save all generated medicines to the database
                Object.keys(data).forEach(timeOfDay => {
                    if (data[timeOfDay]) {
                        data[timeOfDay].forEach(med => {
                            fetch('/save_medicine', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    medicine_name: med,
                                    time_of_day: timeOfDay,
                                    instructions: instructionInput.value
                                })
                            }).catch(console.error);
                        });
                    }
                });
            })
            .catch(err => {
                console.error(err);
                generateBtn.innerHTML = btnOriginalText;

                // Fallback to translations if backend is unavailable
                const lang = scheduleLang.value;
                const routine = scheduleTranslations[lang] || scheduleTranslations['en'];
                morningList.innerHTML = `<li>${routine.morning}</li>`;
                afternoonList.innerHTML = `<li>${routine.afternoon}</li>`;
                nightList.innerHTML = `<li>${routine.night}</li>`;
                generatedSchedule.classList.remove('hidden');
            });
    });

    // Fetch and display saved medicines on load if we are on the dashboard
    if (currentPath === '/' || currentPath === '/dashboard' || currentPath === '/index.html') {
        const trackerList = document.querySelector('.tracker-list');
        if (trackerList) {
            fetch('/get_medicines')
                .then(res => res.json())
                .then(medicines => {
                    if (medicines.length > 0) {
                        // Clear mock data and populate with DB items
                        trackerList.innerHTML = '';
                        medicines.forEach(item => {
                            const timeColors = {
                                'morning': 'bg-primary-soft text-primary',
                                'afternoon': 'bg-amber-100 text-amber-700',
                                'evening': 'bg-orange-100 text-orange-700',
                                'night': 'bg-emerald-100 text-emerald-700'
                            };
                            const colorClass = timeColors[item.time_of_day] || 'bg-gray-100 text-gray-700';
                            
                            trackerList.innerHTML += `
                                <div class="tracker-item slide-up">
                                    <div class="tracker-info">
                                        <h4>${item.medicine_name}</h4>
                                        <p>Scheduled for ${item.time_of_day}</p>
                                    </div>
                                    <div class="tracker-status">
                                        <span class="badge ${colorClass}">${item.time_of_day}</span>
                                        <label class="custom-checkbox">
                                            <input type="checkbox" class="intake-checkbox">
                                            <span class="checkmark"></span>
                                        </label>
                                    </div>
                                </div>
                            `;
                        });

                        // Reattach checkbox logic for newly rendered items
                        const newCheckboxes = document.querySelectorAll('.intake-checkbox');
                        newCheckboxes.forEach(cb => {
                            cb.addEventListener('change', (e) => {
                                const trackerItem = e.target.closest('.tracker-item');
                                if (e.target.checked) {
                                    trackerItem.style.opacity = '0.6';
                                    trackerItem.querySelector('h4').style.textDecoration = 'line-through';
                                } else {
                                    trackerItem.style.opacity = '1';
                                    trackerItem.querySelector('h4').style.textDecoration = 'none';
                                }
                            });
                        });
                    }
                })
                .catch(console.error);
        }
    }

    // Intake Tracker Strike-through
    const checkboxes = document.querySelectorAll('.intake-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const trackerItem = e.target.closest('.tracker-item');
            if (e.target.checked) {
                trackerItem.style.opacity = '0.6';
                trackerItem.querySelector('h4').style.textDecoration = 'line-through';
            } else {
                trackerItem.style.opacity = '1';
                trackerItem.querySelector('h4').style.textDecoration = 'none';
            }
        });
    });

    // Update Date
    const dateSpan = document.getElementById('current-date');
    const today = new Date();
    dateSpan.textContent = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Search Bar filtering
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();

            // Filter History Table
            const rows = document.querySelectorAll('.medicine-table tbody tr');
            rows.forEach(row => {
                const medNameTd = row.querySelector('td:first-child');
                const descTd = row.querySelector('td:nth-child(2)');
                if (!medNameTd || !descTd) return;
                
                const medName = medNameTd.textContent.toLowerCase();
                const desc = descTd.textContent.toLowerCase();
                if (medName.includes(query) || desc.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });

            // Filter Intake Tracker
            const trackerItems = document.querySelectorAll('.tracker-item');
            trackerItems.forEach(item => {
                const header = item.querySelector('h4');
                const p = item.querySelector('p');
                if (!header || !p) return;
                
                const itemName = header.textContent.toLowerCase();
                const itemDesc = p.textContent.toLowerCase();
                if (itemName.includes(query) || itemDesc.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // Filter Upload Extracted Medicines
            const extractedItems = document.querySelectorAll('#extracted-medicines li');
            extractedItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });

            // Filter Schedule Generator Lists
            const scheduleItems = document.querySelectorAll('.time-block ul li');
            scheduleItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                // Avoid hiding the "None" placeholder
                if (text.trim() === 'none') {
                    item.style.display = '';
                    return;
                }
                
                if (text.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Sidebar Active State handling (Now just closes the menu on mobile)
    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(item => {
        item.addEventListener('click', (e) => {
            // On mobile, close sidebar after clicking a link
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // BMI Calculator Logic
    const calculateBmiBtn = document.getElementById('calculate-bmi-btn');
    if (calculateBmiBtn) {
        calculateBmiBtn.addEventListener('click', () => {
            const heightInput = document.getElementById('bmi-height').value;
            const weightInput = document.getElementById('bmi-weight').value;
            
            if (!heightInput || !weightInput) {
                alert("Please enter both height and weight to calculate BMI.");
                return;
            }
            
            // Height is expected in cm, convert to meters for formula
            const heightInMeters = parseFloat(heightInput) / 100;
            const weightInKg = parseFloat(weightInput);
            
            if (heightInMeters <= 0 || weightInKg <= 0) {
                alert("Please enter valid positive numbers.");
                return;
            }
            
            const bmi = weightInKg / (heightInMeters * heightInMeters);
            const roundedBmi = bmi.toFixed(1);
            
            let status = "";
            let color = "";
            let bgColor = "";
            
            if (bmi < 18.5) {
                status = "Underweight";
                color = "#0284c7"; // Blue
                bgColor = "#e0f2fe";
            } else if (bmi >= 18.5 && bmi < 24.9) {
                status = "Normal Weight";
                color = "#16a34a"; // Green
                bgColor = "#dcfce7";
            } else if (bmi >= 25 && bmi < 29.9) {
                status = "Overweight";
                color = "#ea580c"; // Orange
                bgColor = "#ffedd5";
            } else {
                status = "Obese";
                color = "#dc2626"; // Red
                bgColor = "#fee2e2";
            }
            
            // Update UI
            document.getElementById('bmi-placeholder').classList.add('hidden');
            const resultArea = document.getElementById('bmi-result');
            resultArea.classList.remove('hidden');
            
            document.getElementById('bmi-score').style.color = color;
            
            const statusBadge = document.getElementById('bmi-status');
            statusBadge.textContent = trans[status === "Normal Weight" ? "bmiStatusNormal" : "statusActive"]; // Simplified for now
            statusBadge.style.color = color;
            statusBadge.style.backgroundColor = bgColor;
        });
    }

    // UI Translation Dictionary
    const uiTranslations = {
        en: {
            // Settings Page
            settingsTitle: "Localization & Language Settings",
            displayLangLabel: "Display Language",
            displayLangDesc: "Choose the primary language for the application interface.",
            voiceLangLabel: "Voice Output Language",
            voiceLangDesc: "Select the language to be used for Text-to-Speech schedule reading.",
            testBtn: "Test",
            saveBtn: "Save Settings",
            // Sidebar Navigation
            navDashboard: "Dashboard",
            navUpload: "Upload Prescription",
            navMedicine: "Medicine List",
            navHistory: "Prescription History",
            navProfile: "Profile",
            navSettings: "Language Settings",
            // Dashboard & Global
            searchPlaceholder: "Search medicines, reminders...",
            dashboardTitle: "Healthcare Dashboard",
            statsPrescriptions: "Prescriptions Uploaded",
            statsMedicines: "Medicines Detected",
            statsCompliance: "Medicine Compliance",
            statsReminders: "Active Reminders",
            chartTitle: "Compliance & Upload Trends",
            chartDay: "Day",
            chartWeek: "Week",
            chartMonth: "Month",
            // Profile Page
            profileTitle: "Patient Profile Configuration",
            labelAge: "Age",
            labelGender: "Gender",
            labelBloodGroup: "Blood Group",
            labelHeightWeight: "Height / Weight",
            labelConditions: "Known Conditions",
            labelEmergency: "Emergency Contact",
            btnEditProfile: "Edit Profile Information",
            linkAccount: "Link Account",
            linkedAccount: "Linked Account",
            signInGoogle: "Sign in with Google",
            unitYears: "Years",
            // BMI Calculator
            bmiTitle: "BMI Calculator",
            labelHeight: "Height (cm)",
            labelWeight: "Weight (kg)",
            placeholderHeight: "e.g., 175",
            placeholderWeight: "e.g., 70",
            btnCalculateBmi: "Calculate BMI",
            bmiStatusNormal: "Normal Weight",
            bmiPlaceholderText: "Enter your height and weight to calculate your Body Mass Index.",
            // Schedule & Upload
            scheduleTitle: "Schedule Generator",
            scheduleDesc: "Type or speak your doctor's instructions to generate a schedule.",
            placeholderInstructions: "E.g., Take Paracetamol after breakfast and Vitamin D before bed...",
            btnGenerate: "Generate Medicine Schedule",
            yourSchedule: "Your Schedule",
            timeMorning: "Morning",
            timeAfternoon: "Afternoon",
            timeEvening: "Evening",
            timeNight: "Night",
            uploadTitle: "Upload Prescription",
            uploadDesc: "Click or drag image to upload and extract medicines",
            uploadFormats: "Supported formats: JPG, PNG, PDF (Max 10MB)",
            extractResult: "Extraction Result",
            btnUploadAnother: "Upload Another",
            // Intake Tracker
            trackerTitle: "Today's Intake Tracker",
            historyTitle: "Medicine History & Details",
            colMedicine: "Medicine",
            colDescription: "Description",
            colDate: "Date Added",
            colStatus: "Status",
            statusActive: "Active",
            statusPast: "Past"
        },
        hi: {
            settingsTitle: "स्थानीयकरण और भाषा सेटिंग्स",
            displayLangLabel: "प्रदर्शन भाषा",
            displayLangDesc: "एप्लिकेशन इंटरफ़ेस के लिए प्राथमिक भाषा चुनें।",
            voiceLangLabel: "आवाज़ आउटपुट भाषा",
            voiceLangDesc: "टेक्स्ट-टू-स्पीच शेड्यूल पढ़ने के लिए इस्तेमाल होने वाली भाषा चुनें।",
            testBtn: "परीक्षण",
            saveBtn: "सेटिंग्स सहेजें",
            navDashboard: "डैशबोर्ड",
            navUpload: "प्रिस्क्रिप्शन अपलोड करें",
            navMedicine: "दवाओं की सूची",
            navHistory: "प्रिस्क्रिप्शन का इतिहास",
            navProfile: "प्रोफ़ाइल",
            navSettings: "भाषा सेटिंग्स",
            searchPlaceholder: "दवाएं, रिमाइंडर खोजें...",
            dashboardTitle: "हेल्थकेयर डैशबोर्ड",
            statsPrescriptions: "अपलोड किए गए प्रिस्क्रिप्शन",
            statsMedicines: "मिली हुई दवाएं",
            statsCompliance: "दवा अनुपालन",
            statsReminders: "सक्रिय रिमाइंडर",
            chartTitle: "अनुपालन और अपलोड रुझान",
            chartDay: "दिन",
            chartWeek: "सप्ताह",
            chartMonth: "महीना",
            profileTitle: "रोगी प्रोफ़ाइल कॉन्फ़िगरेशन",
            labelAge: "आयु",
            labelGender: "लिंग",
            labelBloodGroup: "रक्त समूह",
            labelHeightWeight: "ऊंचाई / वजन",
            labelConditions: "ज्ञात स्थितियां",
            labelEmergency: "आपातकालीन संपर्क",
            btnEditProfile: "प्रोफ़ाइल जानकारी संपादित करें",
            linkAccount: "खाता लिंक करें",
            linkedAccount: "लिंक किया गया खाता",
            signInGoogle: "गूगल के साथ साइन इन करें",
            unitYears: "वर्ष",
            bmiTitle: "बीएमआई कैलकुलेटर",
            labelHeight: "ऊंचाई (सेमी)",
            labelWeight: "वजन (किलो)",
            placeholderHeight: "जैसे, 175",
            placeholderWeight: "जैसे, 70",
            btnCalculateBmi: "बीएमआई गणना करें",
            bmiStatusNormal: "सामान्य वजन",
            bmiPlaceholderText: "अपना बॉडी मास इंडेक्स गणना करने के लिए अपनी ऊंचाई और वजन दर्ज करें।",
            scheduleTitle: "शेड्यूल जनरेटर",
            scheduleDesc: "शेड्यूल बनाने के लिए अपने डॉक्टर के निर्देश टाइप करें या बोलें।",
            placeholderInstructions: "जैसे, नाश्ते के बाद पैरासिटामोल और सोने से पहले विटामिन डी लें...",
            btnGenerate: "दवा शेड्यूल बनाएं",
            yourSchedule: "आपका शेड्यूल",
            timeMorning: "सुबह",
            timeAfternoon: "दोपहर",
            timeEvening: "शाम",
            timeNight: "रात",
            uploadTitle: "प्रिस्क्रिप्शन अपलोड करें",
            uploadDesc: "दवाएं निकालने के लिए छवि अपलोड करें या खींचें",
            uploadFormats: "समर्थित प्रारूप: JPG, PNG, PDF (अधिकतम 10MB)",
            extractResult: "निकालने का परिणाम",
            btnUploadAnother: "दूसरा अपलोड करें",
            trackerTitle: "आज का सेवन ट्रैकर",
            historyTitle: "दवा इतिहास और विवरण",
            colMedicine: "दवा",
            colDescription: "विवरण",
            colDate: "जोड़ने की तारीख",
            colStatus: "स्थिति",
            statusActive: "सक्रिय",
            statusPast: "पुराना"
        },
        kn: {
            settingsTitle: "ಸ್ಥಳೀಕರಣ ಮತ್ತು ಭಾಷಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
            displayLangLabel: "ಪ್ರದರ್ಶನ ಭಾಷೆ",
            displayLangDesc: "ಅಪ್ಲಿಕೇಶನ್ ಇಂಟರ್‌ಫೇಸ್‌ಗಾಗಿ ಪ್ರಾಥಮಿಕ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            voiceLangLabel: "ಧ್ವನಿ ಔಟ್‌ಪುಟ್ ಭಾಷೆ",
            voiceLangDesc: "ಪಠ್ಯದಿಂದ-ಧ್ವನಿಗೆ ವೇಳಾಪಟ್ಟಿ ಓದುವಿಕೆಗಾಗಿ ಬಳಸಬೇಕಾದ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            testBtn: "ಪರೀಕ್ಷೆ",
            saveBtn: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
            navDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
            navUpload: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
            navMedicine: "ಔಷಧಿಗಳ ಪಟ್ಟಿ",
            navHistory: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಇತಿಹಾಸ",
            navProfile: "ಪ್ರೊಫೈಲ್",
            navSettings: "ಭಾಷಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
            searchPlaceholder: "ಔಷಧಿಗಳು, ಜ್ಞಾಪನೆಗಳನ್ನು ಹುಡುಕಿ...",
            dashboardTitle: "ಆರೋಗ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
            statsPrescriptions: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು",
            statsMedicines: "ಪತ್ತೆಯಾದ ಔಷಧಿಗಳು",
            statsCompliance: "ಔಷಧಿ ಪಾಲನೆ",
            statsReminders: "ಸಕ್ರಿಯ ಜ್ಞಾಪನೆಗಳು",
            chartTitle: "ಪಾಲನೆ ಮತ್ತು ಅಪ್‌ಲೋಡ್ ಪ್ರವೃತ್ತಿಗಳು",
            chartDay: "ದಿನ",
            chartWeek: "ವಾರ",
            chartMonth: "ತಿಂಗಳು",
            profileTitle: "ರೋಗಿಯ ಪ್ರೊಫೈಲ್ ಸಂರಚನೆ",
            labelAge: "ವಯಸ್ಸು",
            labelGender: "ಲಿಂಗ",
            labelBloodGroup: "ರಕ್ತದ ಗುಂಪು",
            labelHeightWeight: "ಎತ್ತರ / ತೂಕ",
            labelConditions: "ತಿಳಿದಿರುವ ಪರಿಸ್ಥಿತಿಗಳು",
            labelEmergency: "ತುರ್ತು ಸಂಪರ್ಕ",
            btnEditProfile: "ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ ತಿದ್ದುಪಡಿ",
            linkAccount: "ಖಾತೆ ಸಂಪರ್ಕಿಸಿ",
            linkedAccount: "ಸಂಪರ್ಕಿತ ಖಾತೆ",
            signInGoogle: "ಗೂಗಲ್ ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ",
            unitYears: "ವರ್ಷಗಳು",
            bmiTitle: "ಬಿಎಂಐ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
            labelHeight: "ಎತ್ತರ (ಸೆಂ.ಮೀ)",
            labelWeight: "ತೂಕ (ಕೆ.ಜಿ)",
            placeholderHeight: "ಉದಾ: 175",
            placeholderWeight: "ಉದಾ: 70",
            btnCalculateBmi: "ಬಿಎಂಐ ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ",
            bmiStatusNormal: "ಸಾಮಾನ್ಯ ತೂಕ",
            bmiPlaceholderText: "ನಿಮ್ಮ ಬಾಡಿ ಮಾಸ್ ಇಂಡೆಕ್ಸ್ ಲೆಕ್ಕಾಚಾರ ಮಾಡಲು ನಿಮ್ಮ ಎತ್ತರ ಮತ್ತು ತೂಕವನ್ನು ನಮೂದಿಸಿ.",
            scheduleTitle: "ವೇಳಾಪಟ್ಟಿ ಜನರೇಟರ್",
            scheduleDesc: "ವೇಳಾಪಟ್ಟಿಯನ್ನು ರಚಿಸಲು ನಿಮ್ಮ ವೈದ್ಯರ ಸೂಚನೆಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ.",
            placeholderInstructions: "ಉದಾ: ತಿಂಡಿಯ ನಂತರ ಪ್ಯಾರಸಿಟಮಾಲ್ ಮತ್ತು ಮಲಗುವ ಮುನ್ನ ವಿಟಮಿನ್ ಡಿ ತೆಗೆದುಕೊಳ್ಳಿ...",
            btnGenerate: "ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ ರಚಿಸಿ",
            yourSchedule: "ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿ",
            timeMorning: "ಬೆಳಿಗ್ಗೆ",
            timeAfternoon: "ಮಧ್ಯಾಹ್ನ",
            timeEvening: "ಸಂಜೆ",
            timeNight: "ರಾತ್ರಿ",
            uploadTitle: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
            uploadDesc: "ಔಷಧಿಗಳನ್ನು ಹೊರತೆಗೆಯಲು ಚಿತ್ರವನ್ನು ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಎಳೆಯಿರಿ",
            uploadFormats: "ಬೆಂಬಲಿತ ಸ್ವರೂಪಗಳು: JPG, PNG, PDF (ಗರಿಷ್ಠ 10MB)",
            extractResult: "ಹೊರತೆಗೆದ ಫಲಿತಾಂಶ",
            btnUploadAnother: "ಮತ್ತೊಂದು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
            trackerTitle: "ಇಂದಿನ ಸೇವನೆ ಟ್ರ್ಯಾಕರ್",
            historyTitle: "ಔಷಧಿ ಇತಿಹಾಸ ಮತ್ತು ವಿವರಗಳು",
            colMedicine: "ಔಷಧಿ",
            colDescription: "ವಿವರಣೆ",
            colDate: "ಸೇರಿಸಲಾದ ದಿನಾಂಕ",
            colStatus: "ಸ್ಥಿತಿ",
            statusActive: "ಸಕ್ರಿಯ",
            statusPast: "ಹಳೆಯದು"
        },
        ta: {
            settingsTitle: "உள்ளூர்மயமாக்கல் மற்றும் மொழி அமைப்புகள்",
            displayLangLabel: "காட்சி மொழி",
            displayLangDesc: "பயன்பாட்டு இடைமுகத்திற்கான முதன்மை மொழியைத் தேர்வுசெய்க.",
            voiceLangLabel: "குரல் வெளியீட்டு மொழி",
            voiceLangDesc: "உரை-க்கு-குரல் அட்டவணை வாசிப்புக்கு பயன்படுத்த வேண்டிய மொழியைத் தேர்ந்தெடுக்கவும்.",
            testBtn: "சோதனை",
            saveBtn: "அமைப்புகளைச் சேமி",
            navDashboard: "டாஷ்போர்டு",
            navUpload: "மருந்து சீட்டை பதிவேற்றவும்",
            navMedicine: "மருந்துகளின் பட்டியல்",
            navHistory: "மருந்து சீட்டு வரலாறு",
            navProfile: "சுயவிவரம்",
            navSettings: "மொழி அமைப்புகள்",
            searchPlaceholder: "மருந்துகள், நினைவூட்டல்களைத் தேடுங்கள்...",
            dashboardTitle: "சுகாதார டாஷ்போர்டு",
            statsPrescriptions: "பதிவேற்றப்பட்ட மருந்து சீட்டுகள்",
            statsMedicines: "கண்டறியப்பட்ட மருந்துகள்",
            statsCompliance: "மருந்து இணக்கம்",
            statsReminders: "செயலில் உள்ள நினைவூட்டல்கள்",
            chartTitle: "இணக்கம் மற்றும் பதிவேற்ற போக்குகள்",
            chartDay: "நாள்",
            chartWeek: "வாரம்",
            chartMonth: "மாதம்",
            profileTitle: "நோயாளி சுயவிவர கட்டமைப்பு",
            labelAge: "வயது",
            labelGender: "பாலினம்",
            labelBloodGroup: "இரத்த வகை",
            labelHeightWeight: "உயரம் / எடை",
            labelConditions: "அறிந்த பாதிப்புகள்",
            labelEmergency: "அவசர தொடர்பு",
            btnEditProfile: "சுயவிவர தகவலைத் திருத்தவும்",
            linkAccount: "கணக்கை இணைக்கவும்",
            linkedAccount: "இணைக்கப்பட்ட கணக்கு",
            signInGoogle: "கூகிள் மூலம் உள்நுழைக",
            unitYears: "ஆண்டுகள்",
            bmiTitle: "பிஎம்ஐ கால்குலேட்டர்",
            labelHeight: "உயரம் (செ.மீ)",
            labelWeight: "எடை (கி.கி)",
            placeholderHeight: "உதாரணம்: 175",
            placeholderWeight: "உதாரணம்: 70",
            btnCalculateBmi: "பிஎம்ஐ கணக்கிடுங்கள்",
            bmiStatusNormal: "சாதாரண எடை",
            bmiPlaceholderText: "உங்கள் உடல் நிறை குறியீட்டைக் கணக்கிட உங்கள் உயரம் மற்றும் எடையை உள்ளிடவும்.",
            scheduleTitle: "அட்டவணை உருவாக்கி",
            scheduleDesc: "அட்டவணையை உருவாக்க உங்கள் மருத்துவரின் வழிமுறைகளைத் தட்டச்சு செய்யவும் அல்லது பேசவும்.",
            placeholderInstructions: "உதாரணம்: காலை உணவிற்குப் பிறகு பாராசிட்டமால் மற்றும் தூங்குவதற்கு முன் வைட்டமின் ಡಿ ತೆಗೆದುಕೊಳ್ಳಿ...",
            btnGenerate: "மருந்து அட்டவணையை உருவாக்கு",
            yourSchedule: "உங்கள் அட்டவணை",
            timeMorning: "காலை",
            timeAfternoon: "மதியம்",
            timeEvening: "மாலை",
            timeNight: "இரவு",
            uploadTitle: "மருந்து சீட்டை பதிவேற்றவும்",
            uploadDesc: "மருந்துகளை பிரித்தெடுக்க படத்தை அப்லோட் செய்யவும் அல்லது இழுக்கவும்",
            uploadFormats: "ஆதரிக்கப்படும் வடிவங்கள்: JPG, PNG, PDF (அதிகபட்சம் 10MB)",
            extractResult: "பிரித்தெடுத்த முடிவு",
            btnUploadAnother: "மற்றொன்றை பதிவேற்றவும்",
            trackerTitle: "இன்றைய உட்கொள்ளல் டிராக்கர்",
            historyTitle: "மருந்து வரலாறு மற்றும் விவரங்கள்",
            colMedicine: "மருந்து",
            colDescription: "விளக்கம்",
            colDate: "சேர்க்கப்பட்ட தேதி",
            colStatus: "நிலை",
            statusActive: "செயலில்",
            statusPast: "கடந்த"
        },
        te: {
            settingsTitle: "స్థానికీకరణ మరియు భాషా సెట్ంగ్‌లు",
            displayLangLabel: "ప్రదర్శన భాష",
            displayLangDesc: "అప్లికేషన్ ఇంటర్‌ఫేస్ కోసం ప్రాథమిక భాషను ఎంచుకోండి.",
            voiceLangLabel: "వాయిస్ అవుట్‌పుట్ భాష",
            voiceLangDesc: "టెక్స్ట్-టు-స్పీచ్ షెడ్యూల్ చదవడానికి ఉపయోగించాల్సిన భాషను ఎంచుకోండి.",
            testBtn: "పరీక్ష",
            saveBtn: "సెట్టింగ్‌లను సేవ్ చేయండి",
            navDashboard: "డ్యాష్‌బోర్డ్",
            navUpload: "ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేయండి",
            navMedicine: "మందుల జాబితా",
            navHistory: "ప్రిస్క్రిప్షన్ చరిత్ర",
            navProfile: "ప్రొఫైల్",
            navSettings: "భాషా సెట్టింగ్‌లు",
            searchPlaceholder: "మందులు, రిమైండర్‌ల కోసం వెతకండి...",
            dashboardTitle: "హెల్త్‌కేర్ డ్యాష్‌బోర్డ్",
            statsPrescriptions: "అప్‌లోడ్ చేసిన ప్రిస్క్రిప్షన్లు",
            statsMedicines: "గుర్తించిన మందులు",
            statsCompliance: "మందుల వాడకం క్రమబద్ధత",
            statsReminders: "యాక్టివ్ రిమైండర్‌లు",
            chartTitle: "క్రమబద్ధత మరియు అప్‌లోడ్ ట్రెండ్‌లు",
            chartDay: "రోజు",
            chartWeek: "వారం",
            chartMonth: "నెల",
            profileTitle: "పేషెంట్ ప్రొఫైల్ కాన్ఫిగరేషన్",
            labelAge: "వయస్సు",
            labelGender: "లింగం",
            labelBloodGroup: "బ్లడ్ గ్రూప్",
            labelHeightWeight: "ఎత్తు / బరువు",
            labelConditions: "తెలిసిన ఆరోగ్య పరిస్థితులు",
            labelEmergency: "ఎమర్జెన్సీ కాంటాక్ట్",
            btnEditProfile: "ప్రొఫైల్ సమాచారాన్ని సవరించండి",
            linkAccount: "ఖాతాను లింక్ చేయండి",
            linkedAccount: "లింక్ చేసిన ఖాతా",
            signInGoogle: "గూగుల్‌తో సైన్ ఇన్ చేయండి",
            unitYears: "సంవత్సరాలు",
            bmiTitle: "BMI కాలిక్యులేటర్",
            labelHeight: "ఎత్తు (సెం.మీ)",
            labelWeight: "బరువు (కేజీలు)",
            placeholderHeight: "ఉదా: 175",
            placeholderWeight: "ఉదా: 70",
            btnCalculateBmi: "BMI లెక్కించండి",
            bmiStatusNormal: "సాధారణ బరువు",
            bmiPlaceholderText: "మీ బాడీ మాస్ ఇండెక్స్ లెక్కించడానికి మీ ఎత్తు మరియు బరువును నమోదు చేయండి.",
            scheduleTitle: "షెడ్యూల్ జనరేటర్",
            scheduleDesc: "షెడ్యూల్ రూపొందించడానికి మీ డాక్టర్ సూచనలను టైప్ చేయండి లేదా మాట్లాడండి.",
            placeholderInstructions: "ఉదా: బ్రేక్‌ఫాస్ట్ తర్వాత పారాసెటమాల్ మరియు పడుకునే ముందు విటమిన్ డి తీసుకోండి...",
            btnGenerate: "మెడిసిన్ షెడ్యూల్ రూపొందించు",
            yourSchedule: "మీ షెడ్యూల్",
            timeMorning: "ఉదయం",
            timeAfternoon: "మధ్యాహ్నం",
            timeEvening: "సాయంత్రం",
            timeNight: "రాత్రి",
            uploadTitle: "ప్రిస్క్రిప్షన్ అప్‌లోడ్ చేయండి",
            uploadDesc: "మందులను సేకరించడానికి చిత్రాన్ని అప్‌లోడ్ చేయండి లేదా ఇక్కడకు లాగండి",
            uploadFormats: "సపోర్టెడ్ ఫార్మాట్లు: JPG, PNG, PDF (గరిష్టంగా 10MB)",
            extractResult: "సేకరించిన ఫలితం",
            btnUploadAnother: "మరొకటి అప్‌లోడ్ చేయండి",
            trackerTitle: "నేటి మందుల ట్రాకర్",
            historyTitle: "మెడిసిన్ హిస్టరీ & వివరాలు",
            colMedicine: "మెడిసిన్",
            colDescription: "వివరణ",
            colDate: "జోడించిన తేదీ",
            colStatus: "స్టేటస్",
            statusActive: "యాక్టివ్",
            statusPast: "గతంలో"
        }
    };

    function applyTranslations(lang) {
        if (!uiTranslations[lang]) return;
        const trans = uiTranslations[lang];
        
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (trans[key]) {
                el.textContent = trans[key];
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (trans[key]) {
                el.placeholder = trans[key];
            }
        });
        
        // Sync all language selectors
        const globalLang = document.getElementById('global-lang');
        const pageLangSelector = document.getElementById('page-lang-selector');
        const schedLangEl = document.getElementById('schedule-lang');
        
        if (globalLang && globalLang.value !== lang) globalLang.value = lang;
        if (pageLangSelector && pageLangSelector.value !== lang) pageLangSelector.value = lang;
        if (schedLangEl && schedLangEl.value !== lang) schedLangEl.value = lang;

        // Save language selection globally
        localStorage.setItem('prescripto_lang', lang);
    }

    // Apply saved language on load
    const savedLang = localStorage.getItem('prescripto_lang') || 'en';
    applyTranslations(savedLang);

    // Language selector change events
    const pageLangSelector = document.getElementById('page-lang-selector');
    if (pageLangSelector) {
        pageLangSelector.addEventListener('change', (e) => {
            applyTranslations(e.target.value);
        });
    }

    // Global Language syncing
    const globalLang = document.getElementById('global-lang');
    if (globalLang) {
        globalLang.addEventListener('change', (e) => {
            const newLang = e.target.value;
            applyTranslations(newLang);
            // Sync with backend async
            fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language_setting: newLang })
            }).catch(console.error);
        });
    }

    // -- USER AUTHENTICATION & DATA FETCHING --
    const isPublicPage = currentPath === '/' || currentPath === '/welcome.html' || currentPath === '/login' || currentPath === '/login.html';
    
    if (!isPublicPage) {
        fetch('/api/me')
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    window.location.href = '/login';
                    throw new Error('Not logged in');
                }
                return res.json();
            })
            .then(data => {
                if (data && data.user) {
                    const user = data.user;
                    
                    // Update global avatar and name if they exist
                    const avatar = document.querySelector('.user-profile img');
                    if (avatar) {
                        const nameForUrl = encodeURIComponent(user.name || user.username || 'User');
                        avatar.src = `https://ui-avatars.com/api/?name=${nameForUrl}&background=e0f2fe&color=0284c7`;
                    }
                    
                    // Populate Profile Page if we are on it
                    if (currentPath === '/profile' || currentPath === '/profile.html') {
                        document.getElementById('profile-display-name').textContent = user.name || user.username || 'N/A';
                        document.getElementById('profile-display-age').textContent = user.age ? `${user.age} Years` : 'N/A';
                        document.getElementById('profile-display-gender').textContent = user.gender || 'N/A';
                        document.getElementById('profile-display-blood').textContent = user.blood_group || 'N/A';
                        document.getElementById('profile-display-height-weight').textContent = user.height_weight || 'N/A';
                        
                        // Parse conditions
                        const conditionsContainer = document.getElementById('profile-display-conditions');
                        conditionsContainer.innerHTML = '';
                        if (user.conditions) {
                            user.conditions.split(',').forEach(cond => {
                                if (cond.trim()) {
                                    conditionsContainer.innerHTML += `<span style="background: var(--clr-light-blue); color: var(--clr-blue); padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600;">${cond.trim()}</span>`;
                                }
                            });
                        } else {
                            conditionsContainer.innerHTML = '<span>None recorded</span>';
                        }
                        
                        document.getElementById('profile-display-emergency').textContent = user.emergency_contact || 'N/A';
                        
                        // Setup the Edit Form values
                        document.getElementById('edit-name').value = user.name || '';
                        document.getElementById('edit-age').value = user.age || '';
                        document.getElementById('edit-gender').value = user.gender || '';
                        document.getElementById('edit-blood').value = user.blood_group || '';
                        document.getElementById('edit-height-weight').value = user.height_weight || '';
                        document.getElementById('edit-conditions').value = user.conditions || '';
                        document.getElementById('edit-emergency').value = user.emergency_contact || '';
                    }

                    // Apply the language setting from the database, unless a local one was explicitly toggled
                     if (user.language_setting && user.language_setting !== (localStorage.getItem('prescripto_lang') || 'en')) {
                        applyTranslations(user.language_setting);
                    }
                }
            })
            .catch(console.error);
    }

    // Toggle logic for Edit Profile
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const profileDisplay = document.getElementById('profile-display');
    const profileEditForm = document.getElementById('profile-edit-form');

    if (editProfileBtn && cancelEditBtn && profileDisplay && profileEditForm) {
        editProfileBtn.addEventListener('click', () => {
            profileDisplay.style.display = 'none';
            profileEditForm.style.display = 'block';
        });

        cancelEditBtn.addEventListener('click', () => {
            profileEditForm.style.display = 'none';
            profileDisplay.style.display = 'flex';
        });

        profileEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('edit-name').value,
                age: document.getElementById('edit-age').value,
                gender: document.getElementById('edit-gender').value,
                blood_group: document.getElementById('edit-blood').value,
                height_weight: document.getElementById('edit-height-weight').value,
                conditions: document.getElementById('edit-conditions').value,
                emergency_contact: document.getElementById('edit-emergency').value,
            };

            const btn = document.getElementById('save-edit-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Saving...';

            fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Error saving profile');
                    btn.textContent = originalText;
                }
            })
            .catch(err => {
                console.error(err);
                alert('Connection error');
                btn.textContent = originalText;
            });
        });
    }

    // Handle logout button natively rather than placeholder
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        // Change onclick behavior to actual logout
        const newLogout = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogout, logoutBtn);
        newLogout.addEventListener('click', () => {
            window.location.href = '/api/logout';
        });
        newLogout.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out';
        newLogout.id = 'btn-logout'; // preserve ID
    }
});
