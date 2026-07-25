const CACHE_NAME = 'thumbnail-cache-v1';

self.addEventListener('fetch', (event) => {
	// リクエストの宛先が画像(image)の場合のみキャッシュ処理を行う
	if (event.request.destination === 'image') {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				// キャッシュに存在する場合はそれを返す
				if (cachedResponse) {
					return cachedResponse;
				}

				// キャッシュにない場合はネットワークから取得
				return fetch(event.request).then((response) => {
					// 正常なレスポンス以外はそのまま返す
					if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
						return response;
					}

					// レスポンスをクローンしてキャッシュに保存
					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return response;
				});
			})
		);
	}
});