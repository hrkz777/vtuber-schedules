<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{{TITLE}}</title>
	<link rel="stylesheet" href="{{RELATIVE_BASE_PATH}}css/style.css">
	<link rel="stylesheet" href="{{RELATIVE_BASE_PATH}}css/schedule.css">
	<link rel="stylesheet" href="{{RELATIVE_BASE_PATH}}css/menu.css">
</head>
<body>
	<!-- ヘッダー -->
	<div class="header-container">
		<button id="open-settings" class="settings-btn settings-menu-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="settings-sheet">☰</button>
		<h1 id="page-title">Loading...</h1>
		<a class="home-btn" href="{{RELATIVE_BASE_PATH}}" data-i18n-aria-label="back_to_top" aria-label="トップへ">⌂</a>
		<div class="filter-container">
			<div id="status-filter-group"  class="filter-group">
				<button class="filter-group-btn active" data-status="all" data-i18n="filter_all"></button>
				<button class="filter-group-btn" data-status="live" data-i18n="filter_live"></button>
				<button class="filter-group-btn" data-status="upcoming" data-i18n="filter_upcoming"></button>
				<button class="filter-group-btn" data-status="video" data-i18n="filter_video"></button>
				<button class="filter-group-btn" data-status="archived" data-i18n="filter_archived"></button>
			</div>
			<div id="platform-filter-group" class="filter-group">
			</div>
		</div>
	</div>

	<!-- 配信スケジュール -->
	<div id="schedule-container"></div>

	<!-- メニュー -->
	<div id="settings-scrim" class="settings-scrim" hidden></div>
	<aside id="settings-sheet" class="settings-sheet" aria-labelledby="settings-sheet-title" hidden>
		<section class="settings-sheet-view active" data-view="root">
			<div class="settings-page-header">
				<button class="settings-back-btn settings-close-btn" type="button" data-i18n-aria-label="settings_close" aria-label="設定を閉じる">‹</button>
				<strong id="settings-sheet-title" data-i18n="settings_title">設定</strong>
			</div>

			<div class="settings-section-block">
				<div class="settings-section-label" data-i18n="settings_section_display">表示</div>
				<div class="settings-group-card">
					<button class="settings-row settings-row-toggle">
						<div class="settings-row-copy">
							<strong data-i18n="settings_dark_theme">ダークテーマ</strong>
							<span data-i18n="settings_dark_theme_desc">ライト/ダークを切り替えます</span>
						</div>
						<div class="settings-row-end">
							<input id="dark-theme-toggle" class="settings-native-toggle" type="checkbox">
							<span id="settings-dark-theme-switch" class="settings-switch" aria-hidden="true"></span>
						</div>
					</button>
					<button class="settings-row nav-row" type="button" data-target-view="size">
						<div class="settings-row-copy">
							<strong data-i18n="settings_card_size">カードサイズ</strong>
							<span data-i18n="settings_card_size_desc">S / M / L から選択します</span>
						</div>
						<div class="settings-row-end">
							<span id="current-size-value" class="settings-current-value">M</span>
							<span class="settings-chevron">›</span>
						</div>
					</button>
				</div>
			</div>

			<div class="settings-section-block">
				<div class="settings-section-label" data-i18n="settings_section_filter">フィルタ</div>
				<div class="settings-group-card">
					<button class="settings-row settings-row-toggle">
						<div class="settings-row-copy">
							<strong data-i18n="hide_archived_in_all">アーカイブを非表示</strong>
							<span data-i18n="settings_hide_archived_desc">「すべて」表示で終了済みを隠します</span>
						</div>
						<div class="settings-row-end">
							<input id="hide-archived-toggle" class="settings-native-toggle" type="checkbox">
							<span id="settings-archive-switch" class="settings-switch" aria-hidden="true"></span>
						</div>
					</button>
				</div>
			</div>

			<div class="settings-section-block">
				<div class="settings-section-label" data-i18n="settings_section_information">情報</div>
				<div class="settings-group-card">
					<button class="settings-row nav-row" type="button" data-target-view="license">
						<div class="settings-row-copy">
							<strong data-i18n="settings_license">ライセンス</strong>
							<span data-i18n="settings_license_desc">使用している素材のライセンス情報を表示します</span>
						</div>
						<div class="settings-row-end">
							<span class="settings-chevron">›</span>
						</div>
					</button>
				</div>
			</div>
		</section>

		<section class="settings-sheet-view" data-view="size">
			<div class="settings-page-header">
				<button class="settings-back-btn" type="button" data-back-to="root" data-i18n-aria-label="settings_back_to_list" aria-label="設定一覧へ戻る">‹</button>
				<div>
					<strong data-i18n="settings_card_size">カードサイズ</strong>
					<span data-i18n="settings_select_size_desc">表示サイズを選択します</span>
				</div>
				<span class="settings-header-spacer" aria-hidden="true"></span>
			</div>
			<div class="settings-subpage-block">
				<div class="settings-group-card settings-option-list">
					<button class="settings-option-row" type="button" data-setting="size" data-value="sm">
						<span>S</span>
						<span class="settings-check">✓</span>
					</button>
					<button class="settings-option-row" type="button" data-setting="size" data-value="md">
						<span>M</span>
						<span class="settings-check">✓</span>
					</button>
					<button class="settings-option-row" type="button" data-setting="size" data-value="lg">
						<span>L</span>
						<span class="settings-check">✓</span>
					</button>
				</div>
			</div>
		</section>

		<section class="settings-sheet-view" data-view="license">
			<div class="settings-page-header">
				<button class="settings-back-btn" type="button" data-back-to="root" data-i18n-aria-label="settings_back_to_list" aria-label="設定一覧へ戻る">‹</button>
				<div>
					<strong data-i18n="settings_license">ライセンス</strong>
					<span data-i18n="settings_license_desc">使用している素材のライセンス情報を表示します</span>
				</div>
				<span class="settings-header-spacer" aria-hidden="true"></span>
			</div>
			<div class="settings-subpage-block">
				<pre id="license-content" class="license-content" aria-live="polite"></pre>
			</div>
		</section>
	</aside>

	<dialog id="share-dialog" class="share-dialog" aria-labelledby="share-dialog-title">
		<div class="share-dialog-content">
			<div class="share-dialog-header">
				<strong id="share-dialog-title" data-i18n="share_dialog_title">共有</strong>
				<button id="close-share-dialog" class="share-dialog-close" type="button" data-i18n-aria-label="share_dialog_close" aria-label="共有を閉じる">×</button>
			</div>
			<div class="share-targets">
				<a id="share-on-x" class="share-target" target="_blank" rel="noopener noreferrer">
					<span class="share-target-icon share-target-x" aria-hidden="true">
						<img src="{{RELATIVE_BASE_PATH}}assets/icons/x_icon.svg" alt="">
					</span>
					<span data-i18n="share_x">X</span>
				</a>
				<a id="share-on-bluesky" class="share-target" target="_blank" rel="noopener noreferrer">
					<span class="share-target-icon share-target-bluesky" aria-hidden="true">
						<img src="{{RELATIVE_BASE_PATH}}assets/icons/bluesky_icon.svg" alt="">
					</span>
					<span data-i18n="share_bluesky">Bluesky</span>
				</a>
			</div>
			<div class="share-copy-row">
				<input id="share-url" class="share-url" type="text" readonly data-i18n-aria-label="share_url_label" aria-label="共有URL">
				<button id="copy-share-url" class="share-copy-button" type="button" data-i18n="copy_link">コピー</button>
			</div>
			<div id="share-status" class="share-status" role="status" aria-live="polite"></div>
		</div>
	</dialog>

	<script>
		window.PAGE_CONFIG = Object.freeze({
			title: {{TITLE_JSON}},
			heading: {{HEADING_JSON}},
			agency: {{AGENCY_JSON}},
			apiUrl: {{API_URL_JSON}},
			relativeBasePath: {{RELATIVE_BASE_PATH_JSON}}
		});
	</script>
	<script src="{{RELATIVE_BASE_PATH}}script.js"></script>
</body>
</html>
