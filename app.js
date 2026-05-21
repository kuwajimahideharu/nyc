/**
 * NYC Loft Cafe & Roasters - Main JS Logic
 * ユーザー体験を高めるインタラクティブなUIコントロールと動的シミュレーション
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --------------------------------------------------------------------------
    // 1. スクロール時のナビゲーションバー制御 & アクティブリンクハイライト
    // --------------------------------------------------------------------------
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // パフォーマンス向上：スクロールごとのレイアウト計算（リフロー）を防ぐため、セクションの座標情報をキャッシュします
    let sectionData = [];
    const updateSectionData = () => {
        sectionData = Array.from(sections).map(section => ({
            id: section.getAttribute('id'),
            top: section.offsetTop - 120, // ヘッダー分のマージンを考慮
            height: section.clientHeight
        }));
    };

    // 初期化およびウィンドウのリサイズ時に座標情報を更新
    updateSectionData();
    window.addEventListener('resize', updateSectionData);

    const handleScroll = () => {
        // スクロール時にNavbarをシャープにする
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // キャッシュされた座標データを使用してアクティブリンクを判定（Layout Thrashing を防止）
        let currentSectionId = '';
        const scrollY = window.scrollY;
        for (let i = 0; i < sectionData.length; i++) {
            const data = sectionData[i];
            if (scrollY >= data.top && scrollY < data.top + data.height) {
                currentSectionId = data.id;
                break;
            }
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初期読み込み時にも実行

    // --------------------------------------------------------------------------
    // 2. モバイルナビゲーションメニューのトグル ＆ スクロール制御
    // --------------------------------------------------------------------------
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (isActive) {
                icon.className = 'fa-solid fa-xmark';
                // iOSにおける背面スクロール防止（スクロールロック）
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
            } else {
                icon.className = 'fa-solid fa-bars';
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }
        });

        // リンククリック時にメニューを閉じ、iOS Safariで確実に目的位置へスムーズスクロールさせる処理
        // (iOSのトランジション中クリック無効化バグを回避するため、JavaScriptでプログラム制御スクロールを行います)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    
                    // メニューの非表示 ＆ スクロールロック解除
                    navMenu.classList.remove('active');
                    const icon = mobileToggle.querySelector('i');
                    if (icon) icon.className = 'fa-solid fa-bars';
                    
                    document.body.style.overflow = '';
                    document.documentElement.style.overflow = '';
                    
                    // スムーズスクロールの実行
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId || 'hero');
                    if (targetElement) {
                        // メニューが閉じるアニメーションと干渉しないよう、僅かに遅らせて実行
                        setTimeout(() => {
                            const headerOffset = 80;
                            const elementPosition = targetElement.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                            
                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }, 50);
                    }
                }
            });
        });
    }

    // ナビゲーションメニュー以外のページ内アンカーリンク（スクロールダウンなど）もJSで滑らかにスクロールさせる
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.closest('.nav-menu')) return; // メニュー内リンクは個別処理されるためスキップ
        
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(href);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --------------------------------------------------------------------------
    // 3. リアルタイム営業時間インジケーター (OPEN/CLOSED)
    // --------------------------------------------------------------------------
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    const updateStoreStatus = () => {
        if (!statusText || !statusIndicator) return;

        const now = new Date();
        const day = now.getDay(); // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTimeInMinutes = hours * 60 + minutes;

        // 営業時間の設定 (分換算)
        // 平日: 8:00 AM - 9:00 PM (480分 〜 1260分)
        // 週末: 9:00 AM - 10:00 PM (540分 〜 1320分)
        const weekdayOpen = 8 * 60;
        const weekdayClose = 21 * 60;
        const weekendOpen = 9 * 60;
        const weekendClose = 22 * 60;

        const isWeekend = (day === 0 || day === 6);
        let isOpen = false;
        let openTimeStr = '';
        let closeTimeStr = '';

        if (isWeekend) {
            isOpen = (currentTimeInMinutes >= weekendOpen && currentTimeInMinutes < weekendClose);
            openTimeStr = '9:00 AM';
            closeTimeStr = '10:00 PM';
        } else {
            isOpen = (currentTimeInMinutes >= weekdayOpen && currentTimeInMinutes < weekdayClose);
            openTimeStr = '8:00 AM';
            closeTimeStr = '9:00 PM';
        }

        const dot = statusIndicator.querySelector('.status-dot');

        if (isOpen) {
            dot.className = 'status-dot open';
            statusText.innerHTML = `OPEN <span style="opacity: 0.7; font-weight:300;">(〜${closeTimeStr}まで営業)</span>`;
            statusIndicator.style.borderColor = 'rgba(46, 196, 182, 0.3)';
        } else {
            dot.className = 'status-dot closed';
            statusText.innerHTML = `CLOSED <span style="opacity: 0.7; font-weight:300;">(開店 ${openTimeStr})</span>`;
            statusIndicator.style.borderColor = 'rgba(231, 111, 81, 0.3)';
        }
    };

    updateStoreStatus();
    setInterval(updateStoreStatus, 60000); // 1分ごとに更新

    // --------------------------------------------------------------------------
    // 4. メニューカテゴリタブ切り替え
    // --------------------------------------------------------------------------
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.menu-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // アクティブなボタンの切り替え
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // コンテンツのフェードアウト＆フェードイン
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.getAttribute('id') === targetTab) {
                    // 少し遅らせてクラスを付与し、スムーズなCSSトランジションを有効化
                    setTimeout(() => {
                        content.classList.add('active');
                    }, 50);
                }
            });
        });
    });

    // --------------------------------------------------------------------------
    // 5. スクロール時のアニメーション発火 (Intersection Observer API)
    // --------------------------------------------------------------------------
    // アニメーションさせたい要素に付与する基本クラスを追加
    const animatedElements = document.querySelectorAll('.story-image-wrapper, .story-content, .location-info, .map-wrapper');
    animatedElements.forEach(el => {
        if (el.classList.contains('reveal-left') || el.classList.contains('reveal-right')) {
            // すでに固有クラスがある場合はそのまま
        } else {
            el.classList.add('reveal');
        }
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // 要素が15%見えたら発火
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // 一度表示されたら監視を終了
            }
        });
    }, observerOptions);

    // 監視を開始
    const allRevealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    allRevealElements.forEach(el => revealObserver.observe(el));

    // --------------------------------------------------------------------------
    // 6. シート予約フォームのインタラクティブシミュレーション
    // --------------------------------------------------------------------------
    const reservationForm = document.getElementById('reservation-form');
    const reservationSuccess = document.getElementById('reservation-success');
    const btnResetReserve = document.getElementById('btn-reset-reserve');
    
    // デフォルト予約日を明日に設定
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        dateInput.min = `${yyyy}-${mm}-${dd}`; // 今日以前は選択不可に
    }

    if (reservationForm && reservationSuccess) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // 入力データの取得
            const name = document.getElementById('name').value;
            const guests = document.getElementById('guests');
            const guestsText = guests.options[guests.selectedIndex].text;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            
            // 選択された席タイプの取得
            const selectedSeatRadio = document.querySelector('input[name="seat-type"]:checked');
            let seatName = 'Window Counter';
            if (selectedSeatRadio) {
                const seatVal = selectedSeatRadio.value;
                if (seatVal === 'sofa') seatName = 'Leather Sofa (ヴィンテージ)';
                else if (seatVal === 'bar') seatName = 'Bar Counter (特等席)';
                else seatName = 'Window Counter (ストリートビュー)';
            }

            // 映画のチケット風PASSへのデータ反映
            document.getElementById('ticket-name').textContent = name.toUpperCase();
            document.getElementById('ticket-guests').textContent = guestsText;
            document.getElementById('ticket-date').textContent = date;
            document.getElementById('ticket-time').textContent = time;
            document.getElementById('ticket-seat').textContent = seatName.toUpperCase();

            // アニメーション付きでフォームを非表示にし、チケット画面を表示
            reservationForm.style.opacity = '0';
            reservationForm.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                reservationForm.classList.add('hidden');
                reservationSuccess.classList.add('show');
                
                // チケットアニメーション用に少し遅らせる
                const ticket = reservationSuccess.querySelector('.ticket-box');
                if (ticket) {
                    ticket.style.transform = 'scale(0.95)';
                    ticket.style.opacity = '0';
                    setTimeout(() => {
                        ticket.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        ticket.style.transform = 'scale(1)';
                        ticket.style.opacity = '1';
                    }, 50);
                }
            }, 400);
        });

        // 別の予約を行うボタンの処理
        if (btnResetReserve) {
            btnResetReserve.addEventListener('click', () => {
                reservationSuccess.classList.remove('show');
                reservationForm.classList.remove('hidden');
                
                setTimeout(() => {
                    reservationForm.style.opacity = '1';
                    reservationForm.style.transform = 'translateY(0)';
                    reservationForm.reset();
                    // 日付を再度明日に設定
                    if (dateInput) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const yyyy = tomorrow.getFullYear();
                        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
                        const dd = String(tomorrow.getDate()).padStart(2, '0');
                        dateInput.value = `${yyyy}-${mm}-${dd}`;
                    }
                }, 50);
            });
        }
    }

    // ==========================================================================
    // Feature E: スクロール進行インジケーター & 微小アニメーション
    // ==========================================================================
    const scrollProgressBar = document.querySelector('.scroll-progress-bar');
    if (scrollProgressBar) {
        // パフォーマンス向上：全体の高さの計算をスクロールごとではなくリサイズイベント時に更新
        let totalScrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        window.addEventListener('resize', () => {
            totalScrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        });
        
        window.addEventListener('scroll', () => {
            const winScroll = window.scrollY || document.documentElement.scrollTop;
            const scrolled = totalScrollHeight > 0 ? (winScroll / totalScrollHeight) * 100 : 0;
            scrollProgressBar.style.width = scrolled + '%';
        });
    }

    // ==========================================================================
    // Feature A: コーヒー・カスタムブレンドシミュレーター (Coffee Roast & Origin Blender)
    // ==========================================================================
    const sliderColombia = document.getElementById('blend-colombia');
    const sliderEthiopia = document.getElementById('blend-ethiopia');
    const sliderBrazil = document.getElementById('blend-brazil');
    const sliderRoast = document.getElementById('blend-roast');

    const labelColombia = document.getElementById('tag-ratio-colombia');
    const labelEthiopia = document.getElementById('tag-ratio-ethiopia');
    const labelBrazil = document.getElementById('tag-ratio-brazil');
    const labelRoast = document.getElementById('tag-roast-level');
    const labelSerial = document.getElementById('tag-serial-num');
    const labelBlendName = document.getElementById('tag-blend-name');

    const polygonRadar = document.getElementById('radar-data-polygon');
    const dotAcidity = document.getElementById('dot-acidity');
    const dotAroma = document.getElementById('dot-aroma');
    const dotSweetness = document.getElementById('dot-sweetness');
    const dotBody = document.getElementById('dot-body');
    const dotBitterness = document.getElementById('dot-bitterness');

    const btnShowChart = document.getElementById('btn-show-chart');
    const btnShowLabel = document.getElementById('btn-show-label');
    const viewChart = document.getElementById('blend-chart-view');
    const viewLabel = document.getElementById('blend-label-view');
    const btnApplyBlend = document.getElementById('btn-apply-blend');

    let appliedBlendName = '';

    // バッチシリアルナンバーの動的生成
    if (labelSerial) {
        const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        labelSerial.textContent = `#BATCH-${new Date().getFullYear()}-${randStr}`;
    }

    // スライダーの自動合計100%バランサー
    const blendSliders = [sliderColombia, sliderEthiopia, sliderBrazil];

    function adjustSliders(changedSlider) {
        const changedId = changedSlider.id;
        const changedVal = parseInt(changedSlider.value, 10);
        
        let otherSliders = blendSliders.filter(s => s.id !== changedId);
        let currentOthersSum = otherSliders.reduce((sum, s) => sum + parseInt(s.value, 10), 0);
        
        const targetOthersSum = 100 - changedVal;
        
        if (currentOthersSum === 0) {
            const half = Math.floor(targetOthersSum / 2);
            otherSliders[0].value = half;
            otherSliders[1].value = targetOthersSum - half;
        } else {
            let rem = targetOthersSum;
            otherSliders.forEach((s, idx) => {
                const curVal = parseInt(s.value, 10);
                if (idx === otherSliders.length - 1) {
                    s.value = rem;
                } else {
                    const share = Math.round((curVal / currentOthersSum) * targetOthersSum);
                    s.value = share;
                    rem -= share;
                }
            });
        }
        
        updateBlendVisuals();
    }

    if (sliderColombia && sliderEthiopia && sliderBrazil) {
        blendSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                adjustSliders(e.target);
            });
            // パーセント表示用のスパン要素をラベルの横に動的挿入
            const label = document.querySelector(`label[for="${slider.id}"]`);
            if (label && !label.querySelector('.slider-val-badge')) {
                const badge = document.createElement('span');
                badge.className = 'slider-val-badge';
                badge.style.marginLeft = '8px';
                badge.style.color = 'var(--color-accent)';
                badge.style.fontWeight = 'bold';
                label.appendChild(badge);
            }
        });
        
        if (sliderRoast) {
            sliderRoast.addEventListener('input', () => {
                updateBlendVisuals();
            });
            // 焙煎度の値表示用バッジをラベルの横に動的挿入
            const label = document.querySelector(`label[for="${sliderRoast.id}"]`);
            if (label && !label.querySelector('.slider-val-badge')) {
                const badge = document.createElement('span');
                badge.className = 'slider-val-badge';
                badge.style.marginLeft = '8px';
                badge.style.color = 'var(--color-accent)';
                badge.style.fontWeight = 'bold';
                label.appendChild(badge);
            }
        }
    }

    // ブレンド特性＆ビジュアルの計算・更新
    function updateBlendVisuals() {
        if (!sliderColombia || !sliderEthiopia || !sliderBrazil || !sliderRoast) return;
        
        const col = parseInt(sliderColombia.value, 10);
        const eth = parseInt(sliderEthiopia.value, 10);
        const brz = parseInt(sliderBrazil.value, 10);
        const roast = parseInt(sliderRoast.value, 10);

        // ラベル横のバッジ更新
        const colBadge = document.querySelector(`label[for="blend-colombia"] .slider-val-badge`);
        if (colBadge) colBadge.textContent = `${col}%`;
        const ethBadge = document.querySelector(`label[for="blend-ethiopia"] .slider-val-badge`);
        if (ethBadge) ethBadge.textContent = `${eth}%`;
        const brzBadge = document.querySelector(`label[for="blend-brazil"] .slider-val-badge`);
        if (brzBadge) brzBadge.textContent = `${brz}%`;

        let roastLabelText = 'Medium';
        let roastName = 'MEDIUM ROAST';
        if (roast === 1) { roastLabelText = 'Light'; roastName = 'LIGHT ROAST'; }
        if (roast === 3) { roastLabelText = 'Dark'; roastName = 'DARK ROAST'; }
        const roastBadge = document.querySelector(`label[for="blend-roast"] .slider-val-badge`);
        if (roastBadge) roastBadge.textContent = roastLabelText;

        // タグの割合更新
        if (labelColombia) labelColombia.textContent = `${col}%`;
        if (labelEthiopia) labelEthiopia.textContent = `${eth}%`;
        if (labelBrazil) labelBrazil.textContent = `${brz}%`;
        if (labelRoast) labelRoast.textContent = roastName;

        // フレーバー基本プロファイル (0-100)
        const profileCol = { acid: 80, aroma: 85, sweet: 70, body: 60, bitter: 40 };
        const profileEth = { acid: 98, aroma: 95, sweet: 80, body: 45, bitter: 20 };
        const profileBrz = { acid: 40, aroma: 65, sweet: 75, body: 85, bitter: 65 };

        let acid = (col * profileCol.acid + eth * profileEth.acid + brz * profileBrz.acid) / 100;
        let aroma = (col * profileCol.aroma + eth * profileEth.aroma + brz * profileBrz.aroma) / 100;
        let sweet = (col * profileCol.sweet + eth * profileEth.sweet + brz * profileBrz.sweet) / 100;
        let body = (col * profileCol.body + eth * profileEth.body + brz * profileBrz.body) / 100;
        let bitter = (col * profileCol.bitter + eth * profileEth.bitter + brz * profileBrz.bitter) / 100;

        // 焙煎度による変調
        if (roast === 1) { // 浅煎り
            acid = Math.min(100, acid * 1.25);
            aroma = Math.min(100, aroma * 1.15);
            sweet = sweet * 0.9;
            body = body * 0.75;
            bitter = bitter * 0.45;
        } else if (roast === 3) { // 深煎り
            acid = acid * 0.35;
            aroma = aroma * 0.9;
            sweet = sweet * 0.85;
            body = Math.min(100, body * 1.25);
            bitter = Math.min(100, bitter * 1.6);
        } else { // 中煎り
            sweet = Math.min(100, sweet * 1.1);
            bitter = bitter * 0.95;
        }

        // SVGレーダーチャートの座標更新 (中心 150,150, 最大半径 120)
        const cx = 150, cy = 150, maxR = 120;
        const angles = [
            -Math.PI / 2, // Acidity (真上)
            -Math.PI / 2 + (2 * Math.PI / 5), // Aroma (右斜め上)
            -Math.PI / 2 + (4 * Math.PI / 5), // Sweetness (右斜め下)
            -Math.PI / 2 + (6 * Math.PI / 5), // Body (左斜め下)
            -Math.PI / 2 + (8 * Math.PI / 5)  // Bitterness (左斜め上)
        ];

        const values = [acid, aroma, sweet, body, bitter];
        const points = [];

        values.forEach((v, idx) => {
            const r = (v / 100) * maxR;
            const x = cx + r * Math.cos(angles[idx]);
            const y = cy + r * Math.sin(angles[idx]);
            points.push(`${Math.round(x)},${Math.round(y)}`);
            
            // データポイントドット更新
            let dot = null;
            if (idx === 0) dot = dotAcidity;
            else if (idx === 1) dot = dotAroma;
            else if (idx === 2) dot = dotSweetness;
            else if (idx === 3) dot = dotBody;
            else if (idx === 4) dot = dotBitterness;

            if (dot) {
                dot.setAttribute('cx', Math.round(x));
                dot.setAttribute('cy', Math.round(y));
            }
        });

        if (polygonRadar) {
            polygonRadar.setAttribute('points', points.join(' '));
        }

        // ブレンド名のかっこいい自動生成ロジック
        let prefix = 'BROOKLYN';
        let middle = 'HARMONY';
        let suffix = 'BLEND';

        if (col >= 45) { prefix = 'EL PARAISO'; middle = 'SILK'; }
        else if (eth >= 45) { prefix = 'YIRGACHEFFE'; middle = 'FLORAL'; }
        else if (brz >= 45) { prefix = 'SANTOS'; middle = 'VELVET'; }

        if (roast === 1) {
            suffix = 'LIGHT WAVE';
            if (eth > col) middle = 'NECTAR';
        } else if (roast === 3) {
            suffix = 'DARK GOLD';
            if (brz > col) middle = 'BLACKOUT';
        } else {
            suffix = 'BRONZE ROAST';
        }

        if (labelBlendName) {
            labelBlendName.textContent = `${prefix} ${middle} ${suffix}`;
        }
    }

    // チャートとタグのタブ切り替え
    if (btnShowChart && btnShowLabel && viewChart && viewLabel) {
        btnShowChart.addEventListener('click', () => {
            btnShowChart.classList.add('active');
            btnShowLabel.classList.remove('active');
            viewChart.classList.remove('hidden');
            viewLabel.classList.add('hidden');
        });

        btnShowLabel.addEventListener('click', () => {
            btnShowLabel.classList.add('active');
            btnShowChart.classList.remove('active');
            viewLabel.classList.remove('hidden');
            viewChart.classList.add('hidden');
        });
    }

    // ブレンド適用ボタンの処理
    if (btnApplyBlend) {
        btnApplyBlend.addEventListener('click', () => {
            if (labelBlendName) {
                appliedBlendName = labelBlendName.textContent;
                
                const originalHTML = btnApplyBlend.innerHTML;
                btnApplyBlend.innerHTML = `<i class="fa-solid fa-circle-check text-highlight"></i> <span>予約チケットに適用完了！</span>`;
                btnApplyBlend.style.borderColor = 'var(--color-accent)';
                btnApplyBlend.style.backgroundColor = 'rgba(212, 163, 89, 0.15)';

                // 予約セクションへスムーズにスクロール
                const reservationSection = document.getElementById('reservation');
                if (reservationSection) {
                    setTimeout(() => {
                        reservationSection.scrollIntoView({ behavior: 'smooth' });
                    }, 800);
                }

                setTimeout(() => {
                    btnApplyBlend.innerHTML = originalHTML;
                    btnApplyBlend.style.borderColor = '';
                    btnApplyBlend.style.backgroundColor = '';
                }, 4000);
            }
        });
    }

    // 初期実行
    updateBlendVisuals();


    // ==========================================================================
    // Feature B: インタラクティブ座席フロアマップ (SVG Floor Map)
    // ==========================================================================
    const mapSeats = document.querySelectorAll('.map-seat');
    const seatRadios = document.querySelectorAll('input[name="seat-type"]');

    if (mapSeats.length > 0 && seatRadios.length > 0) {
        // 初期選択状態の反映
        const initialRadio = document.querySelector('input[name="seat-type"]:checked');
        if (initialRadio) {
            const val = initialRadio.value;
            mapSeats.forEach(seat => {
                if (seat.getAttribute('data-seat') === val) {
                    seat.classList.add('selected');
                }
            });
        }

        // SVG席クリック時のバインディング
        mapSeats.forEach(seat => {
            seat.addEventListener('click', () => {
                const seatType = seat.getAttribute('data-seat');
                const matchingRadio = document.querySelector(`input[name="seat-type"][value="${seatType}"]`);
                if (matchingRadio) {
                    matchingRadio.checked = true;
                    matchingRadio.dispatchEvent(new Event('change'));
                }
            });
        });

        // フォームラジオボタン変更時のバインディング
        seatRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const checkedRadio = document.querySelector('input[name="seat-type"]:checked');
                if (checkedRadio) {
                    const selectedVal = checkedRadio.value;
                    mapSeats.forEach(seat => {
                        if (seat.getAttribute('data-seat') === selectedVal) {
                            seat.classList.add('selected');
                        } else {
                            seat.classList.remove('selected');
                        }
                    });
                }
            });
        });
    }

    // 予約送信成功時に動的チケットに適用されたブレンド名を表示するインターセプター
    const originalSubmitHandler = reservationForm ? reservationForm.onsubmit : null;
    if (reservationForm) {
        reservationForm.addEventListener('submit', () => {
            const ticketBody = document.querySelector('.ticket-body');
            const existingRow = document.getElementById('ticket-blend-row');
            if (existingRow) existingRow.remove();

            if (appliedBlendName && ticketBody) {
                const blendRow = document.createElement('div');
                blendRow.className = 'ticket-row';
                blendRow.id = 'ticket-blend-row';
                blendRow.innerHTML = `<span class="lbl">COFFEE:</span> <span class="val" style="color:var(--color-accent); font-weight:bold;">${appliedBlendName}</span>`;
                
                // SEATの行の下に挿入
                const seatValEl = document.getElementById('ticket-seat');
                if (seatValEl) {
                    const seatRow = seatValEl.parentNode;
                    seatRow.parentNode.insertBefore(blendRow, seatRow.nextSibling);
                } else {
                    ticketBody.appendChild(blendRow);
                }
            }
        });
    }


    // ==========================================================================
    // Feature D: バリスタ抽出タイマー＆ガイド (Brew Guide & Interactive Timer)
    // ==========================================================================
    const selectCups = document.getElementById('brew-cups');
    const calcBeans = document.getElementById('calc-beans');
    const calcWater = document.getElementById('calc-water');
    
    const btnTimerStart = document.getElementById('btn-timer-start');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const timerClock = document.getElementById('timer-clock');
    const timerProgressBar = document.getElementById('timer-progress-bar');
    const timerStateLabel = document.getElementById('timer-state');
    const timerStepTitle = document.getElementById('timer-step-title');
    const timerStepInstruction = document.getElementById('timer-step-instruction');
    const brewMethodRadios = document.getElementsByName('brew-method');

    let timerId = null;
    let timerRunning = false;
    let timerMethod = 'v60';
    let currentStepIdx = 0;
    let remainingSeconds = 0;
    let currentStepTotal = 0;
    let currentStepsList = [];

    const v60TimerSteps = [
        { title: '1. 蒸らし (Blooming)', state: 'BLOOMING', duration: 30, desc: '少量のお湯を全体にかけ、30秒間蒸らします。豆からガスが抜け、ふっくら膨らんで甘みが引き立ちます。' },
        { title: '2. 第1投 (First Pour)', state: 'DRIP 1', duration: 45, desc: '中心から外へ円を描くようにお湯を注ぎます。湯量の半分（約250ml）をゆっくり一定の太さで落とします。' },
        { title: '3. 第2投 (Second Pour)', state: 'DRIP 2', duration: 45, desc: '残りのお湯を数回に分けて注ぎます。フィルターの中心から均等に落としきり、雑味が出る前に引き上げます。' }
    ];

    const pressTimerSteps = [
        { title: '1. 蒸らし (Blooming)', state: 'BLOOMING', duration: 30, desc: '粗挽きのコーヒー粉にお湯を少量注ぎ、30秒間なじませて炭酸ガスを効率的に放出させます。' },
        { title: '2. 抽出・静置 (Steeping)', state: 'STEEPING', duration: 180, desc: '残りのお湯をすべて注ぎ、プランジャーを上げた状態のままフタをし、3分間じっくり香りと旨みを引き出します。' },
        { title: '3. プレス (Plunging)', state: 'PLUNGING', duration: 20, desc: 'つまみを持ち、金属フィルターをゆっくり20秒かけて押し下げます。コーヒーの素晴らしいオイル分も逃しません。' }
    ];

    function calculateDose() {
        if (!selectCups || !calcBeans || !calcWater) return;
        const cups = parseInt(selectCups.value, 10);
        // 1杯あたり 15g豆 / 230ml湯
        calcBeans.textContent = `${cups * 15} g`;
        calcWater.textContent = `${cups * 230} ml`;
    }

    if (selectCups) {
        selectCups.addEventListener('change', calculateDose);
        calculateDose();
    }

    function initTimerSequence() {
        let activeMethod = 'v60';
        brewMethodRadios.forEach(radio => {
            if (radio.checked) activeMethod = radio.value;
        });

        timerMethod = activeMethod;
        currentStepsList = timerMethod === 'v60' ? v60TimerSteps : pressTimerSteps;
        currentStepIdx = 0;

        loadTimerStep(0);
        if (btnTimerReset) btnTimerReset.classList.add('hidden');
    }

    function loadTimerStep(idx) {
        if (idx >= currentStepsList.length) {
            completeTimer();
            return;
        }

        currentStepIdx = idx;
        const step = currentStepsList[idx];
        remainingSeconds = step.duration;
        currentStepTotal = step.duration;

        if (timerStateLabel) timerStateLabel.textContent = step.state;
        if (timerStepTitle) timerStepTitle.textContent = step.title;
        if (timerStepInstruction) timerStepInstruction.textContent = step.desc;

        renderTimerDisplay();
    }

    function renderTimerDisplay() {
        const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
        const s = String(remainingSeconds % 60).padStart(2, '0');
        if (timerClock) timerClock.textContent = `${m}:${s}`;

        if (timerProgressBar) {
            const ratio = remainingSeconds / currentStepTotal;
            const offset = ratio * 534; // 全周534px
            timerProgressBar.style.strokeDashoffset = offset;
        }
    }

    function runTimerTick() {
        timerId = setInterval(() => {
            remainingSeconds--;
            
            if (remainingSeconds < 0) {
                playIntervalBell(); // 中間ステップ移行音
                loadTimerStep(currentStepIdx + 1);
            } else {
                renderTimerDisplay();
            }
        }, 1000);
    }

    function playIntervalBell() {
        if (audioCtx) {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(659.25, now); // E5 (ソフトなチャイム)
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    }

    function completeTimer() {
        clearInterval(timerId);
        timerId = null;
        timerRunning = false;

        if (timerStateLabel) timerStateLabel.textContent = 'FINISHED';
        if (timerStepTitle) timerStepTitle.textContent = 'Ready to Serve!';
        if (timerStepInstruction) timerStepInstruction.textContent = '極上のハンドドリップコーヒーの完成です。カップに注ぎ、ニューヨークの香りと風味をお楽しみください。';
        if (timerClock) timerClock.textContent = '00:00';
        if (timerProgressBar) timerProgressBar.style.strokeDashoffset = 0;

        if (btnTimerStart) {
            btnTimerStart.innerHTML = `<i class="fa-solid fa-play"></i> スタート`;
        }

        // Web Audio による本格ベル音のシンセ再生！
        playChimeBell();
    }

    if (btnTimerStart) {
        btnTimerStart.addEventListener('click', () => {
            if (!audioCtx) initAudio();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            if (timerRunning) {
                // ポーズ
                clearInterval(timerId);
                timerId = null;
                timerRunning = false;
                btnTimerStart.innerHTML = `<i class="fa-solid fa-play"></i> 再開`;
                if (timerStateLabel) timerStateLabel.textContent = 'PAUSED';
            } else {
                // スタート / 再開
                const state = timerStateLabel ? timerStateLabel.textContent : 'READY';
                if (state === 'READY' || state === 'FINISHED') {
                    initTimerSequence();
                }
                
                timerRunning = true;
                btnTimerStart.innerHTML = `<i class="fa-solid fa-pause"></i> 一時停止`;
                if (btnTimerReset) btnTimerReset.classList.remove('hidden');
                
                // 再開時は現在のステップ状態ラベルに戻す
                if (timerStateLabel) timerStateLabel.textContent = currentStepsList[currentStepIdx].state;
                runTimerTick();
            }
        });
    }

    if (btnTimerReset) {
        btnTimerReset.addEventListener('click', () => {
            clearInterval(timerId);
            timerId = null;
            timerRunning = false;

            if (btnTimerStart) btnTimerStart.innerHTML = `<i class="fa-solid fa-play"></i> スタート`;
            if (timerStateLabel) timerStateLabel.textContent = 'READY';
            if (timerStepTitle) timerStepTitle.textContent = 'Brewing Guide';
            if (timerStepInstruction) timerStepInstruction.textContent = '「スタート」ボタンを押して、バリスタドリップのシミュレーションを開始してください。';
            if (timerClock) timerClock.textContent = '00:00';
            if (timerProgressBar) timerProgressBar.style.strokeDashoffset = 534;

            btnTimerReset.classList.add('hidden');
        });
    }

    // 器具選択の切り替え
    brewMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (!timerRunning) {
                initTimerSequence();
                if (timerStateLabel) timerStateLabel.textContent = 'READY';
                if (timerStepTitle) timerStepTitle.textContent = 'Brewing Guide';
                if (timerStepInstruction) timerStepInstruction.textContent = '「スタート」ボタンを押して、バリスタドリップのシミュレーションを開始してください。';
                if (timerClock) timerClock.textContent = '00:00';
                if (timerProgressBar) timerProgressBar.style.strokeDashoffset = 534;
            }
        });
    });


    // ==========================================================================
    // Feature C: ブルックリン・アンビエント音響プレイヤー (Brooklyn Soundscape Player)
    // ==========================================================================
    const playerWidget = document.getElementById('ambient-player');
    const btnPlay = document.getElementById('player-play-btn');
    const btnMinimize = document.getElementById('player-minimize');
    const btnTrigger = document.getElementById('player-trigger');
    const volumeSlider = document.getElementById('player-volume');
    
    const btnSoundJazz = document.getElementById('btn-sound-jazz');
    const btnSoundRain = document.getElementById('btn-sound-rain');
    const btnSoundCrackle = document.getElementById('btn-sound-crackle');
    
    const trackTitleText = document.getElementById('track-title');
    const trackStatusText = document.getElementById('track-status');

    let audioCtx = null;
    let mainGainNode = null;
    let isPlaying = false;

    // 音源とゲイン管理
    let jazzAudio = null;
    let isJazzActive = true; // デフォルトオン

    let rainSource = null;
    let rainFilter = null;
    let rainGainNode = null;
    let rainLfo = null;
    let rainLfoGain = null;
    let isRainActive = false;

    let crackleActive = false;
    let crackleTimer = null;
    let crackleGainNode = null;
    let isCrackleActive = false;

    // アナログレコード特有の常時サーフェス溝ノイズと回転（うねり）感の変数
    let crackleSurfaceSource = null;
    let crackleSurfaceFilter = null;
    let crackleSurfaceLfo = null;
    let crackleSurfaceLfoGain = null;

    // プレイヤー開閉トグル
    if (btnTrigger && playerWidget) {
        btnTrigger.addEventListener('click', () => {
            playerWidget.classList.add('active');
        });
    }
    if (btnMinimize && playerWidget) {
        btnMinimize.addEventListener('click', () => {
            playerWidget.classList.remove('active');
        });
    }

    // 個別音源のオン・オフ切り替え
    if (btnSoundJazz) {
        btnSoundJazz.addEventListener('click', () => {
            isJazzActive = !isJazzActive;
            btnSoundJazz.classList.toggle('active', isJazzActive);
            updateAmbientMixer();
        });
    }
    if (btnSoundRain) {
        btnSoundRain.addEventListener('click', () => {
            isRainActive = !isRainActive;
            btnSoundRain.classList.toggle('active', isRainActive);
            updateAmbientMixer();
        });
    }
    if (btnSoundCrackle) {
        btnSoundCrackle.addEventListener('click', () => {
            isCrackleActive = !isCrackleActive;
            btnSoundCrackle.classList.toggle('active', isCrackleActive);
            updateAmbientMixer();
        });
    }

    // Web Audio API および Mixer の初期設定
    function initAudio() {
        if (audioCtx) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        mainGainNode = audioCtx.createGain();
        const initialVol = volumeSlider ? parseInt(volumeSlider.value, 10) / 100 : 0.5;
        mainGainNode.gain.setValueAtTime(initialVol, audioCtx.currentTime);
        mainGainNode.connect(audioCtx.destination);

        // --- 1. Lofi Jazz BGM (CORS制限や file:// 回避のため AudioContext に接続せず直接音量調整) ---
        jazzAudio = new Audio();
        jazzAudio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        jazzAudio.loop = true;
        jazzAudio.volume = 0; // 初期音量はゼロ

        // --- 2. プロシージャル雨音用ゲイン ---
        rainGainNode = audioCtx.createGain();
        rainGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        rainGainNode.connect(mainGainNode);

        // --- 3. プロシージャルパチパチ音用ゲイン ---
        crackleGainNode = audioCtx.createGain();
        crackleGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        crackleGainNode.connect(mainGainNode);
    }

    // Web Audio 用の極めて強固で滑らかなフェード (setTargetAtTime使用)
    function fadeChannel(gainNode, targetVal, duration = 0.4) {
        if (!audioCtx || !gainNode) return;
        const now = audioCtx.currentTime;
        try {
            gainNode.gain.cancelScheduledValues(now);
            // 時定数 (timeConstant) に duration / 3.0 を指定することで滑らかに到達
            gainNode.gain.setTargetAtTime(targetVal, now, duration / 3.0);
        } catch (e) {
            gainNode.gain.value = targetVal;
        }
    }

    // CORSの壁を完全に越えてHTML5 Audioの音量を滑らかにフェードする独自制御
    function fadeJazzVolume(targetVal, duration = 0.5) {
        if (!jazzAudio) return;
        const startVal = jazzAudio.volume;
        const steps = 25;
        const stepTime = (duration * 1000) / steps;
        const diff = targetVal - startVal;
        let currentStep = 0;

        if (jazzAudio.dataset && jazzAudio.dataset.fadeTimer) {
            clearInterval(parseInt(jazzAudio.dataset.fadeTimer, 10));
        }

        const interval = setInterval(() => {
            currentStep++;
            if (!jazzAudio || currentStep >= steps) {
                if (jazzAudio) jazzAudio.volume = targetVal;
                clearInterval(interval);
            } else {
                jazzAudio.volume = Math.max(0, Math.min(1, startVal + diff * (currentStep / steps)));
            }
        }, stepTime);

        if (jazzAudio.dataset) {
            jazzAudio.dataset.fadeTimer = String(interval);
        }
    }

    // 白ノイズ生成ノード
    function createWhiteNoiseNode() {
        if (!audioCtx) return null;
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        return whiteNoise;
    }

    // 雨音シンセサイザー
    function startRainSynth() {
        if (!audioCtx || rainSource) return;

        rainSource = createWhiteNoiseNode();
        if (!rainSource) return;

        rainFilter = audioCtx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(600, audioCtx.currentTime); // 落ち着いたこもり感

        // 雨足の強弱を演出するLFO (低周波発振器)
        rainLfo = audioCtx.createOscillator();
        rainLfo.type = 'sine';
        rainLfo.frequency.setValueAtTime(0.06, audioCtx.currentTime); // 16秒の緩やかな周期

        rainLfoGain = audioCtx.createGain();
        rainLfoGain.gain.setValueAtTime(0.05, audioCtx.currentTime); // ゲイン変調幅

        // 接続
        rainLfo.connect(rainLfoGain);
        rainLfoGain.connect(rainGainNode.gain);

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGainNode);

        rainSource.start(0);
        rainLfo.start(0);
    }

    // 雨音シンセ停止
    function stopRainSynth() {
        if (rainSource) {
            try { rainSource.stop(); } catch(e){}
            rainSource = null;
        }
        if (rainLfo) {
            try { rainLfo.stop(); } catch(e){}
            rainLfo = null;
        }
    }

    // アナログレコードの常時サーフェスノイズ（回転うねり感）の電子合成
    function startCrackleSurface() {
        if (!audioCtx || crackleSurfaceSource) return;

        crackleSurfaceSource = createWhiteNoiseNode();
        if (!crackleSurfaceSource) return;

        // レコード盤の温かみのある摩擦音を再現するためのバンドパスフィルター
        crackleSurfaceFilter = audioCtx.createBiquadFilter();
        crackleSurfaceFilter.type = 'bandpass';
        crackleSurfaceFilter.frequency.setValueAtTime(320, audioCtx.currentTime);
        crackleSurfaceFilter.Q.setValueAtTime(0.65, audioCtx.currentTime);

        // 33 RPMレコードの1回転（約1.8秒＝0.55Hz）の周期で音量をうねらせるLFO
        crackleSurfaceLfo = audioCtx.createOscillator();
        crackleSurfaceLfo.type = 'sine';
        crackleSurfaceLfo.frequency.setValueAtTime(0.55, audioCtx.currentTime);

        crackleSurfaceLfoGain = audioCtx.createGain();
        crackleSurfaceLfoGain.gain.setValueAtTime(0.03, audioCtx.currentTime); // うねりの強さ

        // サーフェスノイズ全体のベースゲイン
        const baseGain = audioCtx.createGain();
        baseGain.gain.setValueAtTime(0.05, audioCtx.currentTime); // チリチリという心地よい定常背景音

        // 接続
        crackleSurfaceLfo.connect(crackleSurfaceLfoGain);
        crackleSurfaceLfoGain.connect(baseGain.gain);

        crackleSurfaceSource.connect(crackleSurfaceFilter);
        crackleSurfaceFilter.connect(baseGain);
        baseGain.connect(crackleGainNode);

        crackleSurfaceSource.start(0);
        crackleSurfaceLfo.start(0);
    }

    function stopCrackleSurface() {
        if (crackleSurfaceSource) {
            try { crackleSurfaceSource.stop(); } catch(e){}
            crackleSurfaceSource = null;
        }
        if (crackleSurfaceLfo) {
            try { crackleSurfaceLfo.stop(); } catch(e){}
            crackleSurfaceLfo = null;
        }
    }

    // レコードパチパチ音 (高音クリック - 接続先の専用ゲインノードに直接結合)
    function triggerSingleCrackle() {
        if (!audioCtx || !crackleActive) return;

        const now = audioCtx.currentTime;
        const duration = 0.003 + Math.random() * 0.012;

        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        // 周波数を高めにして針が乗った瞬間のクリアなパチッ音を再現
        osc.frequency.setValueAtTime(2500 + Math.random() * 2500, now);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(4500 + Math.random() * 2500, now);
        filter.Q.setValueAtTime(8.0, now); // Qを高めにして非常にクリスピーに

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        // 音量を引き上げて存在感を際立たせる (約3〜4倍にアップ)
        gain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.12, now + 0.0005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(crackleGainNode);

        osc.start(now);
        osc.stop(now + duration + 0.01);
    }

    // レコードプツッ音 (低域ポップノイズ - 接続先の専用ゲインノードに直接結合)
    function triggerLowPop() {
        if (!audioCtx || !crackleActive) return;

        const now = audioCtx.currentTime;
        const duration = 0.015 + Math.random() * 0.025;

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(75 + Math.random() * 40, now); // 低めの太いポップ

        // 低域ポップノイズ専用のローパスフィルターを追加し、金属的な粗さをカットして温かい「ボコッ」という物理音にする
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(130, now);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        // 音量を約3倍引き上げ、よりはっきりとしたレコード傷の thumps を表現
        gain.gain.linearRampToValueAtTime(0.09 + Math.random() * 0.13, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(crackleGainNode);

        osc.start(now);
        osc.stop(now + duration + 0.01);
    }

    // レコードノイズループ
    function startCrackleSynth() {
        if (crackleActive) return;
        crackleActive = true;

        startCrackleSurface(); // 定常ノイズと33回転うねりを開始

        const loop = () => {
            if (!crackleActive) return;
            triggerSingleCrackle();
            if (Math.random() < 0.25) { // 傷ノイズの確率をわずかに増加
                triggerLowPop();
            }
            const delay = 40 + Math.random() * 450; // 不規則なパチパチ間隔
            crackleTimer = setTimeout(loop, delay);
        };
        loop();
    }

    function stopCrackleSynth() {
        crackleActive = false;
        if (crackleTimer) {
            clearTimeout(crackleTimer);
            crackleTimer = null;
        }
        stopCrackleSurface(); // 定常ノイズと33回転うねりを停止
    }

    // ミキサーの音源合成制御
    function updateAmbientMixer() {
        if (!isPlaying || !audioCtx) return;

        // 1. Lofi Jazz BGM (CORS影響を完全に受けないダイレクト音量スライド)
        const masterVol = volumeSlider ? parseInt(volumeSlider.value, 10) / 100 : 0.5;
        if (isJazzActive) {
            if (jazzAudio) {
                jazzAudio.play().catch(err => {
                    console.warn('[NYC Cafe] BGM再生エラー', err);
                });
            }
            fadeJazzVolume(0.45 * masterVol);
        } else {
            fadeJazzVolume(0);
            setTimeout(() => {
                if (!isJazzActive && jazzAudio) jazzAudio.pause();
            }, 600);
        }

        // 2. 雨音
        if (isRainActive) {
            startRainSynth();
            fadeChannel(rainGainNode, 0.22);
        } else {
            fadeChannel(rainGainNode, 0);
            setTimeout(() => {
                if (!isRainActive) stopRainSynth();
            }, 600);
        }

        // 3. レコードパチパチ
        if (isCrackleActive) {
            startCrackleSynth();
            fadeChannel(crackleGainNode, 0.55);
        } else {
            fadeChannel(crackleGainNode, 0);
            setTimeout(() => {
                if (!isCrackleActive) stopCrackleSynth();
            }, 600);
        }

        // トラックタイトル文言の更新
        let tracksList = [];
        if (isJazzActive) tracksList.push('Lofi Jazz');
        if (isRainActive) tracksList.push('Soft Rain');
        if (isCrackleActive) tracksList.push('Vinyl Crackle');

        if (trackTitleText) {
            trackTitleText.textContent = tracksList.length > 0 ? tracksList.join(' + ') : 'Silent Lounge';
        }
    }

    // プレイヤーのメイン再生トグル
    function toggleAudioPlayback() {
        if (!audioCtx) initAudio();

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isPlaying = !isPlaying;

        if (isPlaying) {
            playerWidget.classList.add('playing');
            if (btnPlay) btnPlay.innerHTML = `<i class="fa-solid fa-pause"></i>`;
            if (trackStatusText) trackStatusText.textContent = 'Now Playing...';
            updateAmbientMixer();
        } else {
            playerWidget.classList.remove('playing');
            if (btnPlay) btnPlay.innerHTML = `<i class="fa-solid fa-play"></i>`;
            if (trackStatusText) trackStatusText.textContent = 'Ambient Paused';
            
            fadeJazzVolume(0);
            fadeChannel(rainGainNode, 0);
            fadeChannel(crackleGainNode, 0);

            setTimeout(() => {
                if (!isPlaying) {
                    if (jazzAudio) jazzAudio.pause();
                    stopRainSynth();
                    stopCrackleSynth();
                }
            }, 600);
        }
    }

    if (btnPlay) {
        btnPlay.addEventListener('click', toggleAudioPlayback);
    }

    // ボリュームスライダーの動作
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            const val = parseInt(volumeSlider.value, 10) / 100;
            if (mainGainNode) {
                mainGainNode.gain.setValueAtTime(val, audioCtx ? audioCtx.currentTime : 0);
            }
            
            // Lofi Jazzの音量もマスター音量に合わせてリアルタイムに同期させる
            if (jazzAudio && isPlaying && isJazzActive) {
                if (jazzAudio.dataset && jazzAudio.dataset.fadeTimer) {
                    clearInterval(parseInt(jazzAudio.dataset.fadeTimer, 10));
                    jazzAudio.dataset.fadeTimer = '';
                }
                jazzAudio.volume = 0.45 * val;
            }
            
            const volIcon = document.querySelector('.volume-slider-container .volume-icon');
            if (volIcon) {
                if (val === 0) {
                    volIcon.className = 'fa-solid fa-volume-xmark volume-icon';
                } else if (val < 0.45) {
                    volIcon.className = 'fa-solid fa-volume-low volume-icon';
                } else {
                    volIcon.className = 'fa-solid fa-volume-high volume-icon';
                }
            }
        });
    }

    // --- 抽出タイマー完了チャイム用の豪華ベル合成 (FMシンセ風) ---
    function playChimeBell() {
        if (!audioCtx) initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const now = audioCtx.currentTime;
        const decay = 2.4; // 豊かな余韻
        
        const bellGain = audioCtx.createGain();
        bellGain.gain.setValueAtTime(0, now);
        bellGain.gain.linearRampToValueAtTime(0.28, now + 0.005); // アタック
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        bellGain.connect(audioCtx.destination);
        
        // 基本波 (880Hz - A5)
        const f0 = 880;
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(f0, now);
        
        // 第2倍音 (1760Hz)
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f0 * 2, now);
        const g2 = audioCtx.createGain();
        g2.gain.setValueAtTime(0.08, now);
        
        // 第3倍音 (2640Hz)
        const osc3 = audioCtx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(f0 * 3, now);
        const g3 = audioCtx.createGain();
        g3.gain.setValueAtTime(0.04, now);
        
        // 非調和金属成分 (1125Hz)
        const oscMet = audioCtx.createOscillator();
        oscMet.type = 'triangle';
        oscMet.frequency.setValueAtTime(1125, now);
        const gMet = audioCtx.createGain();
        gMet.gain.setValueAtTime(0.025, now);
        
        osc1.connect(bellGain);
        osc2.connect(g2); g2.connect(bellGain);
        osc3.connect(g3); g3.connect(bellGain);
        oscMet.connect(gMet); gMet.connect(bellGain);
        
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        oscMet.start(now);
        
        osc1.stop(now + decay);
        osc2.stop(now + decay);
        osc3.stop(now + decay);
        oscMet.stop(now + decay);
    }
});

// --------------------------------------------------------------------------
// 7. 画像読み込みエラー時の自動拡張子フォールバック処理 (グローバル)
// --------------------------------------------------------------------------
// ユーザーが保存した画像の拡張子（.jpeg, .jpg, .JPEG, .JPG, .png 等）が混在しても、
// 自動的に他の候補を検証して表示させるための堅牢なフォールバック機構です。
// HTMLのパース中エラーにも対応するため、DOM読み込み完了を待たずに即座に有効化します。
(function() {
    const fallbackExtensions = ['.jpeg', '.jpg', '.JPEG', '.JPG', '.png', '.PNG', '.webp'];
    const defaultFallbackImage = 'images/latte_art.png';

    window.addEventListener('error', (e) => {
        // img要素のエラーのみを対象とする
        if (e.target && e.target.tagName === 'IMG') {
            const img = e.target;
            const currentSrc = img.src;

            // すでにフォールバックに失敗しているか、デフォルト画像も失敗している場合は無限ループ防止のためスキップ
            if (img.dataset.fallbackFailed) {
                return;
            }

            if (currentSrc.includes(defaultFallbackImage)) {
                img.dataset.fallbackFailed = 'true';
                return;
            }

            // URLからクエリパラメータを除外した純粋なパスを取得
            const urlPath = currentSrc.split('?')[0];
            const match = urlPath.match(/\.([^./\\]+)$/); // 拡張子のマッチング

            if (match) {
                const currentExt = '.' + match[1];
                let fallbackIndex = parseInt(img.dataset.fallbackIndex || '-1', 10);

                if (fallbackIndex === -1) {
                    // 初回エラー：現在の拡張子が候補リストにあるか探し、その次のインデックスから試す
                    fallbackIndex = fallbackExtensions.indexOf(currentExt);
                }

                fallbackIndex++;

                if (fallbackIndex < fallbackExtensions.length) {
                    // 次の候補拡張子を試す
                    img.dataset.fallbackIndex = fallbackIndex;
                    const nextExt = fallbackExtensions[fallbackIndex];

                    // 拡張子部分を置換して新しいsrcを設定
                    const baseWithoutExt = urlPath.substring(0, urlPath.lastIndexOf(currentExt));
                    img.src = baseWithoutExt + nextExt;
                } else {
                    // すべての候補が全滅した場合は、デフォルトの代替画像を表示
                    img.dataset.fallbackFailed = 'true';
                    img.src = defaultFallbackImage;
                    console.warn(`[NYC Cafe] 画像の読み込みに失敗しました。すべての拡張子候補を試しましたが存在しないため、デフォルト画像にフォールバックします: ${urlPath}`);
                }
            } else {
                // 拡張子が見つからない場合は直接デフォルト画像へ
                img.dataset.fallbackFailed = 'true';
                img.src = defaultFallbackImage;
            }
        }
    }, true); // キャプチャフェーズでエラーイベントを捕捉（バブリングしないエラーイベントを確実にキャッチするため）
})();
