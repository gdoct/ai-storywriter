from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from .config import settings
from .tools import ALL_TOOLS


def build_agent():
    llm = ChatOpenAI(
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        model=settings.llm_model,
        streaming=True,
    )
    return create_react_agent(llm, ALL_TOOLS)


agent = build_agent()
