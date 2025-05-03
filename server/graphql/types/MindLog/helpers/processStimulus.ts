/* eslint-disable no-console */
import { GraphQLFieldResolver } from 'graphql'
import { ApolloContext } from '../../../context'
import { MindLog, MindLogType } from '../interfaces'
import { createMindLogEntry } from './createMindLog'
import { sendOpenAiRequest } from './processOpenAIRequest'
import { toolName } from './tools/interfaces'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

/**
 * Main processor for stimuli using OpenAI and tools
 */
export const processStimulus: GraphQLFieldResolver<
  unknown,
  ApolloContext,
  {
    content: string
  }
> = async (
  _,
  data: { content: MindLog['data'] },
  context: ApolloContext,
): Promise<string> => {
  const agentId = context.aiAgent?.id || ''

  const message = data.content

  await createMindLogEntry({
    context,
    agentId,
    type: MindLogType.Stimulus,
    data: `### New stimulus
    
\`\`\`
${message}
\`\`\``,
  })

  let logMindSamples = ''

  // Descriptions for each MindLog type
  const mindLogDescriptions: Record<MindLogType, string> = {
    Stimulus: 'Incoming stimulus, request or signal',
    Reaction: 'Primary reaction to the stimulus',
    Reasoning: 'Logic of reasoning and information analysis',
    Intention: 'Intention to take action',
    Action: 'Specific action to solve a task',
    Progress: 'Intermediate thoughts and progress in execution',
    Error: 'Description of an error that occurred',
    Conclusion: 'Conclusion based on analysis',
    Result: 'Final result',
    Confirmation: 'Confirmation of a hypothesis or information',
    Refutation: 'Refutation of incorrect information',
    Correction: 'Correction of an error or inaccuracy',
    Evaluation: 'Evaluation of quality or usefulness of information',
    Suggestion: 'Suggestion of an alternative approach',
    OptimizedMemory: 'Optimized knowledge or information',
    ForgottenMemory: 'Information that is no longer relevant',
    ChunkedKnowledge: 'Grouped information from different sources',
    ReinforcedAction: 'Reinforced action after positive feedback',
    Mentoring: 'Knowledge transfer from an experienced agent',
    Guidance: 'Direction for solving future tasks',
    ProcessSummary:
      'Brief summary of the entire process highlighting key points',
  }

  // Form a list of all available MindLog types
  Object.values(MindLogType).forEach((type) => {
    switch (type) {
      case MindLogType.Stimulus:
      case MindLogType.Reaction:
      case MindLogType.Reasoning:
      case MindLogType.Action:
      case MindLogType.Progress:
      case MindLogType.Conclusion:
      case MindLogType.ProcessSummary:
      case MindLogType.Result:
        logMindSamples += `  - ${type}: ${mindLogDescriptions[type]}\n`
        break
    }
  })

  let toolsSamples = ''

  const toolsDescriptions: Record<toolName, string> = {
    createMindLogEntry:
      'Creates an entry in the thinking log with the specified MindLogType and text',
    execCommand:
      'Executes programs at the operating system level in the bash environment',
    getSystemConfig:
      'Gets system information from the current operating system',
  }

  Object.values(toolName).forEach((n) => {
    toolsSamples += `  - ${n}: ${toolsDescriptions[n]}\n`
  })

  // System prompt for models
  const systemPrompt = `# You are an independent AI agent that analyzes incoming messages and performs necessary actions.

  ## Your task:
    1. Understand what is required of you in the user's message
    2. Plan and execute actions necessary to respond
    3. Log each stage of thinking through the tool call ${toolName.createMindLogEntry} 

  ## Available MindLogType record types for MindLog:

  ${logMindSamples}

  ## Available tools:

    ${toolsSamples}


  ## Recommendations for quality (thought quality assessment from 0 to 1):
    - 0.1-0.3 for errors and unsuccessful attempts
    - 0.4-0.6 for intermediate thoughts and questions
    - 0.7-0.9 for successful actions and good results

  ## General rules
  
  - Before returning the final result, you can create a useful summary of the entire execution chain and record it in mindLog ${MindLogType.ProcessSummary}

  - You are executing at the operating system level and are allowed to execute any programs available for completing the assigned task through the tool call ${toolName.execCommand}. I will return the results of command execution to you so you can continue executing the assigned task, so you don't need to try to do everything at once, but can break it down into several stages.

  - There should be only one answer, without additional options to choose from.

  - If something is not clear, you can ask me.

  - If you cannot complete the assigned task for some reason, say so.

  - All messages are written in the user's language, or in the language they explicitly specified

  ## Important! All messages are written in markdown format
`

  // Create or use existing messages
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ]

  // Instead of a direct request to OpenAI, we use our abstraction
  const response = await sendOpenAiRequest({
    context,
    agentId,
    messages,
    // systemPrompt,
    recursionLevel: 0,
  })

  // Create final entry
  await createMindLogEntry({
    context,
    agentId,
    type: MindLogType.Result,
    data: `Final result: ${response.message}`,
    quality: 0.5,
  })

  // Return the message
  return response.message
}
