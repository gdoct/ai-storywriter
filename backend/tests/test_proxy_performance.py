import time


def test_proxy_performance(client):
    """Test proxy endpoint performance under load"""
    start_time = time.time()
    for _ in range(100):
        response = client.get('/proxy/llm/v1/models')
        # Accept 400, 200, or 502 (bad gateway if no backend is mocked)
        assert response.status_code in (200, 400, 502)
    duration = time.time() - start_time
    assert duration < 5.0  # Should complete 100 requests in under 5 seconds
