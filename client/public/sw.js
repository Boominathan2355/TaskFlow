self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Focus the window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If a window is already open, focus it
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url && 'focus' in client) {
                    // Send a message to the client to handle the action
                    client.postMessage({
                        type: 'NOTIFICATION_ACTION',
                        action: event.action
                    });
                    return client.focus();
                }
            }
            // If no window is open, open one (optional, but for a call usually we want the existing one)
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
