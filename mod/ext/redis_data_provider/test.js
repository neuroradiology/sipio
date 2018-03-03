/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Fonoster Resources Module"
 */
import DataSource from 'ext/redis_data_provider/ds'
import AgentsAPI from 'ext/redis_data_provider/agents_api'
import { Status } from 'data_provider/status'

const ObjectId = Packages.org.bson.types.ObjectId
const agentsApi = new AgentsAPI()
export let testGroup = { name: "Redis Data Provider" }

const ds = new DataSource()

testGroup.basic_operations = function () {
    let agent = {
        apiVersion: 'v1.0',
        kind: "Agent",
        metadata: {
            name: "John Doe"
        },
        spec: {
            domains: ['sip.local'],
            credentials: {
                username: '1001',
                secret: 'secret'
            }
        }
    }

    const initSize = ds.withCollection('agents').find().result.length
    const response = ds.insert(agent)
    let endSize = ds.withCollection('agents').find().result.length

    assertTrue(ObjectId.isValid(response.result))
    assertTrue(endSize == (initSize + 1))
    assertTrue(agent.metadata.name.equals("John Doe"))

    ds.withCollection('agents').remove(response.result)
    endSize = ds.withCollection('agents').find().result.length
    assertTrue (initSize == endSize)
}

testGroup.get_collection = function () {
    let agent = {
        apiVersion: 'v1.0',
        kind: "Agent",
        metadata: {
            name: "John Doe"
        },
        spec: {
            domains: ['sip.local'],
            credentials: {
                username: '1001',
                secret: 'secret'
            }
        }
    }

    const initSize = ds.withCollection('agents').find().result.length
    const ref = ds.insert(agent).result

    // Existing Agent
    let response = ds.withCollection('agents').find("@.spec.credentials.username==1001")
    assertTrue(response.status == Status.OK)

    // Non-Existing Agent
    response = ds.withCollection('agents').find("@.spec.credentials.username=='peter'")
    assertTrue(response.result.length == 0)

    // Invalid filter
    response = ds.withCollection('agents').find("@.spec.credentials.username==mike'")
    assertTrue(response.status == Status.BAD_REQUEST)

    ds.withCollection('agents').remove(ref)
    const endSize = ds.withCollection('agents').find().result.length

    assertTrue:(initSize == endSize)
}

// This also validates the other resources
testGroup.get_agents = function () {
    let john = {
        apiVersion: 'v1.0',
        kind: "Agent",
        metadata: {
            name: "John Doe"
        },
        spec: {
            domains: ['sip.local'],
            credentials: {
                username: '1001',
                secret: 'secret'
            }
        }
    }

    let jane = {
        apiVersion: 'v1.0',
        kind: "Agent",
        metadata: {
            name: "Jane Doe"
        },
        spec: {
            domains: ['sip.local'],
            credentials: {
                username: '1002',
                secret: 'secret'
            }
        }
    }

    const ref1 = ds.insert(john).result
    const ref2 = ds.insert(jane).result

    const l = ds.withCollection('agents')
        .find("'sip.local' in @.spec.domains").result

    assertTrue(l.length == 2)

    // NOTE: The space will not work in the console because is considered another parameter
    const response = agentsApi.getAgents("@.spec.credentials.username=='1001' || @.spec.credentials.username=='1002'")

    assertTrue(response.status == Status.OK)
    assertTrue(response.result.length == 2)

    // Cleanup
    ds.withCollection('agents').remove(ref1)
    ds.withCollection('agents').remove(ref2)
}

// This also validates the other resources
testGroup.get_agent = function () {
    let agent = {
        apiVersion: 'v1.0',
        kind: "Agent",
        metadata: {
            name: "John Doe",
            ref: "ag3f77f6"
        },
        spec: {
            domains: ['sip.local'],
            credentials: {
                username: '1001',
                secret: 'secret'
            }
        }
    }

    const ref = ds.insert(agent).result
    const response = agentsApi.getAgent('ag3f77f6')
    assertTrue(response.status == Status.OK)
    assertTrue(response.result.kind == 'Agent')
    // Cleanup
    ds.withCollection('agents').remove(ref)
}