feature: policies
description: |
  Policies are a way to define rules and behaviors for the system. They can be used to enforce security, compliance, and operational standards.

  Policies can be defined in YAML files and can include conditions, actions, and other parameters.

  Policies can be applied to various resources such as users, groups, roles, and more.

  Policies can also be used to control access to features and functionalities within the system.

we want to implement policies in the bakend to define the diffent tiers of users and their access to features and functionalities.

  Policies can be used to define the following:

  - User roles and permissions
  - Access control to resources
  - Security and compliance requirements
  - Operational standards and best practices

  Policies can be managed through a user interface or through API calls.

  Policies can be versioned and audited to ensure compliance with organizational standards.

  Policies can also be used to trigger actions based on specific conditions or events.
  Policies can be defined in a hierarchical manner, allowing for inheritance and overrides.
  Policies can be tested and validated to ensure they work as expected before being applied to the system.
  
  we define four tiers of users
| Feature                       | Basic | BYOK | Premium | Admin |
|-------------------------------|:-----:|:----:|:-------:|:-----:|
| Read stories                  |   ✓   |  ✓  |    ✓    |  ✓   |
| Create scenarios              |   ✓   |  ✓  |    ✓    |  ✓   |
| Save scenarios                |   ✓   |  ✓  |    ✓    |  ✓   |
| Preview markdown              |       |  ✓  |    ✓    |  ✓   |
| AI generate functions         |       |  ✓  |    ✓    |  ✓   |
| Save AI generated stories     |       |     |    ✓    |  ✓   |
| Publish AI generated stories  |       |     |    ✓    |  ✓   |
| Advanced analytics            |       |     |    ✓    |  ✓   |
| Priority support              |       |     |    ✓    |  ✓   |
| Access to custom models       |       |     |    ✓    |  ✓   |
| Manage policies               |       |     |         |  ✓   |
| User management              |       |     |         |  ✓   |



as policies are versioned we can retain a history of policies applied to the system.
we store policies in a table policy with the following fields. the settings field contains the policy settings for all user classifications in JSON format. the conditions field contains the conditions that must be met for the policy to apply (such as: day of week, global free credit status, etc), also in JSON format. the settings field is a JSON document that contains the actual settings for the policy, including the access rights for each user classification.:
| Field Name       | Type        | Description                                      |
|------------------|-------------|--------------------------------------------------|
| id               | UUID        | Unique identifier for the policy                 |
| name             | String      | Name of the policy                               |
| description      | String      | Description of the policy                        |
| version          | Integer     | Version number of the policy                     | 
| created_at       | Timestamp   | Timestamp when the policy was created            |
| updated_at       | Timestamp   | Timestamp when the policy was last updated       |
| is_active        | Boolean     | Indicates if the policy is currently active      |
| conditions       | JSON        | Conditions that must be met for the policy to apply |
| settings         | JSON        | the actual settings document in json format      |
| created_by       | UUID        | User who created the policy                      |
| updated_by       | UUID        | User who last updated the policy                 |
| is_default       | Boolean     | Indicates if the policy is a default policy      |
| is_deprecated    | Boolean     | Indicates if the policy is deprecated            |
| deprecated_at    | Timestamp   | Timestamp when the policy was deprecated         |
| deprecated_by    | UUID        | User who deprecated the policy                   |
| is_archived      | Boolean     | Indicates if the policy is archived              |
| archived_at      | Timestamp   | Timestamp when the policy was archived           |
| archived_by      | UUID        | User who archived the policy                     |

there must be a table  policy_set. this table contains sets of policies and an order field to determine the order in which policies are applied. this allows for multiple policies to be applied to the system, with the ability to override settings based on the order of policies.

| Field Name       | Type        | Description                                      |
|------------------|-------------|--------------------------------------------------|
| id               | UUID        | Unique identifier for the policy set             |
| name             | String      | Name of the policy set                           |
| description      | String      | Description of the policy set                    |
| version          | Integer     | Version number of the policy set                 |
| created_at       | Timestamp   | Timestamp when the policy set was created        |
| updated_at       | Timestamp   | Timestamp when the policy set was last updated   |
| is_active        | Boolean     | Indicates if the policy set is currently active  |
| policies         | JSON        | List of policy IDs in the set, in order          |

then there must be a table app_active_policy. it contains records for app settings, and one is the active policy id. we need to track when policies are applied to the system, so we can revert to a previous policy if needed or investigate financial claims with discounts. this table will also contain the current active policy id, which is used to determine the current settings for the system.
| Field Name       | Type        | Description                                      |
|------------------|-------------|--------------------------------------------------|
| id               | UUID        | Unique identifier for the app setting            |
| policy_set_id    | UUID        | Unique identifier for the policy set             |
| value            | JSON        | Value of the app setting in JSON format          |
| created_at       | Timestamp   | Timestamp when the app setting was created       |
| updated_at       | Timestamp   | Timestamp when the app setting was last updated  |
| is_active        | Boolean     | Indicates if the app setting is currently active |

on startup, the system will check if there is an active policy set in the app_active_policy table. if there is, it will load the settings from the active policy set and apply them to the system. if there is no active policy set, the system will use default settings.

when a user attempts to access a feature or functionality, the system will check the user's classification and the current active policy settings to determine if the user has access. if the user does not have access, an error message will be returned indicating that the user does not have permission to access the feature.