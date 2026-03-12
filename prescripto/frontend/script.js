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
            
            document.getElementById('bmi-score').textContent = roundedBmi;
            document.getElementById('bmi-score').style.color = color;
            
            const statusBadge = document.getElementById('bmi-status');
            statusBadge.textContent = status;
            statusBadge.style.color = color;
            statusBadge.style.backgroundColor = bgColor;
        });
    }

    // Global Language syncing
    const globalLang = document.getElementById('global-lang');
    if (globalLang) {
        globalLang.addEventListener('change', (e) => {
            const schedLangEl = document.getElementById('schedule-lang');
            if (schedLangEl) {
                schedLangEl.value = e.target.value;
            }
        });
    }
});
