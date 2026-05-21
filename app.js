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

    const handleScroll = () => {
        // スクロール時にNavbarをシャープにする
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 現在見ているセクションに応じてナビリンクのアクティブクラスを切り替える
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120; // ヘッダー分のマージンを考慮
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

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
    // 2. モバイルナビゲーションメニューのトグル
    // --------------------------------------------------------------------------
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // リンククリック時にメニューを閉じる
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
            });
        });
    }

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
