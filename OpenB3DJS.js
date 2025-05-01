	var GLctx;
	const BackBufferToTex = Module.cwrap('BackBufferToTex', null, ['number', 'number']);
	const CameraToTex = Module.cwrap('CameraToTex', null, ['number', 'number' ,'number']);
	//const TexToBuffer = Module.cwrap('TexToBuffer', null, ['number', 'string' ,'number']);
	const MeshCullRadius = Module.cwrap('MeshCullRadius', null, ['number', 'number']);
	const AddAnimSeq = Module.cwrap('AddAnimSeq', 'number', ['number', 'number']);
	const AddMesh = Module.cwrap('AddMesh', null, ['number', 'number']);
	const AddTriangle = Module.cwrap('AddTriangle', 'number', ['number', 'number', 'number', 'number']);
	const AddVertex = Module.cwrap('AddVertex', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
	const AmbientLight = Module.cwrap('AmbientLight', null, ['number', 'number', 'number']);
	const Animate = Module.cwrap('Animate', null, ['number', 'number', 'number', 'number', 'number']);
	const Animating = Module.cwrap('Animating', 'number', ['number']);
	const AnimLength = Module.cwrap('AnimLength', 'number', ['number']);
	const AnimSeq = Module.cwrap('AnimSeq', 'number', ['number']);
	const AnimTime = Module.cwrap('AnimTime', 'number', ['number']);
	const BrushAlpha = Module.cwrap('BrushAlpha', null, ['number', 'number']);
	const BrushBlend = Module.cwrap('BrushBlend', null, ['number', 'number']);
	const BrushColor = Module.cwrap('BrushColor', null, ['number', 'number', 'number', 'number']);
	const BrushFX = Module.cwrap('BrushFX', null, ['number', 'number']);
	const BrushShininess = Module.cwrap('BrushShininess', null, ['number', 'number']);
	const BrushTexture = Module.cwrap('BrushTexture', null, ['number', 'number', 'number', 'number']);
	const CameraClsColor = Module.cwrap('CameraClsColor', null, ['number', 'number', 'number', 'number']);
	const CameraClsMode = Module.cwrap('CameraClsMode', null, ['number', 'number', 'number']);
	const CameraFogColor = Module.cwrap('CameraFogColor', null, ['number', 'number', 'number', 'number']);
	const CameraFogMode = Module.cwrap('CameraFogMode', null, ['number', 'number']);
	const CameraFogRange = Module.cwrap('CameraFogRange', null, ['number', 'number', 'number']);
	const CameraPick = Module.cwrap('CameraPick', 'number', ['number', 'number', 'number']);
	const CameraProject = Module.cwrap('CameraProject', null, ['number', 'number', 'number', 'number']);
	const CameraProjMode = Module.cwrap('CameraProjMode', null, ['number', 'number']);
	const CameraRange = Module.cwrap('CameraRange', null, ['number', 'number', 'number']);
	const CameraViewport = Module.cwrap('CameraViewport', null, ['number', 'number', 'number', 'number', 'number']);
	const CameraZoom = Module.cwrap('CameraZoom', null, ['number', 'number']);
	const ClearCollisions = Module.cwrap('ClearCollisions', null, []);
	const ClearSurface = Module.cwrap('ClearSurface', null, ['number', 'number', 'number']);
	const ClearTextureFilters = Module.cwrap('ClearTextureFilters', null, []);
	const ClearWorld = Module.cwrap('ClearWorld', null, ['number', 'number', 'number']);
	const CollisionEntity = Module.cwrap('CollisionEntity', 'number', ['number', 'number']);
	const Collisions = Module.cwrap('Collisions', null, ['number', 'number', 'number', 'number']);
	const CollisionNX = Module.cwrap('CollisionNX', 'number', ['number', 'number']);
	const CollisionNY = Module.cwrap('CollisionNY', 'number', ['number', 'number']);
	const CollisionNZ = Module.cwrap('CollisionNZ', 'number', ['number', 'number']);
	const CollisionSurface = Module.cwrap('CollisionSurface', 'number', ['number', 'number']);
	const CollisionTime = Module.cwrap('CollisionTime', 'number', ['number', 'number']);
	const CollisionTriangle = Module.cwrap('CollisionTriangle', 'number', ['number', 'number']);
	const CollisionX = Module.cwrap('CollisionX', 'number', ['number', 'number']);
	const CollisionY = Module.cwrap('CollisionY', 'number', ['number', 'number']);
	const CollisionZ = Module.cwrap('CollisionZ', 'number', ['number', 'number']);
	const CountBones = Module.cwrap('CountBones', 'number', ['number']);
	const CountChildren = Module.cwrap('CountChildren', 'number', ['number']);
	const CountCollisions = Module.cwrap('CountCollisions', 'number', ['number']);
	const CopyEntity = Module.cwrap('CopyEntity', 'number', ['number', 'number']);
	const CopyMesh = Module.cwrap('CopyMesh', 'number', ['number', 'number']);
	const CountSurfaces = Module.cwrap('CountSurfaces', 'number', ['number']);
	const CountTriangles = Module.cwrap('CountTriangles', 'number', ['number']);
	const CountVertices = Module.cwrap('CountVertices', 'number', ['number']);
	const CreateBlob = Module.cwrap('CreateBlob', 'number', ['number', 'number', 'number']);
	const CreateBone = Module.cwrap('CreateBone', 'number', ['number', 'number']);
	const CreateBrush = Module.cwrap('CreateBrush', 'number', ['number', 'number', 'number']);
	const CreateCamera = Module.cwrap('CreateCamera', 'number', ['number']);
	const CreateConstraint = Module.cwrap('CreateConstraint', 'number', ['number', 'number', 'number']);
	const CreateCone = Module.cwrap('CreateCone', 'number', ['number', 'number', 'number']);
	const CreateCylinder = Module.cwrap('CreateCylinder', 'number', ['number', 'number', 'number']);
	const CreateCube = Module.cwrap('CreateCube', 'number', ['number']);
	const CreateGeosphere = Module.cwrap('CreateGeosphere', 'number', ['number', 'number']);
	const CreateMesh = Module.cwrap('CreateMesh', 'number', ['number']);
	const CreateLight = Module.cwrap('CreateLight', 'number', ['number', 'number']);
	const CreatePivot = Module.cwrap('CreatePivot', 'number', ['number']);
	const CreatePlane = Module.cwrap('CreatePlane', 'number', ['number', 'number']);
	const CreateQuad = Module.cwrap('CreateQuad', 'number', ['number']);
	const CreateRigidBody = Module.cwrap('CreateRigidBody', 'number', ['number', 'number', 'number', 'number', 'number']);
	const CreateShadow = Module.cwrap('CreateShadow', 'number', ['number', 'number']);
	const CreateSphere = Module.cwrap('CreateSphere', 'number', ['number', 'number']);
	const CreateSprite = Module.cwrap('CreateSprite', 'number', ['number']);
	const CreateSurface = Module.cwrap('CreateSurface', 'number', ['number', 'number']);
	const CreateStencil = Module.cwrap('CreateStencil', 'number', []);
	const CreateTerrain = Module.cwrap('CreateTerrain', 'number', ['number', 'number']);
	const CreateTexture = Module.cwrap('CreateTexture', 'number', ['number', 'number', 'number', 'number']);
	const CreateVoxelSprite = Module.cwrap('CreateVoxelSprite', 'number', ['number', 'number']);
	const DeltaPitch = Module.cwrap('DeltaPitch', 'number', ['number', 'number']);
	const DeltaYaw = Module.cwrap('DeltaYaw', 'number', ['number', 'number']);
	const EmitterVector = Module.cwrap('EmitterVector', null, ['number', 'number', 'number', 'number']);
	const EmitterRate = Module.cwrap('EmitterRate', null, ['number', 'number']);
	const EmitterParticleLife = Module.cwrap('EmitterParticleLife', null, ['number', 'number']);
	const EmitterParticleSpeed = Module.cwrap('EmitterParticleSpeed', null, ['number', 'number']);
	const EmitterVariance = Module.cwrap('EmitterVariance', null, ['number', 'number']);
	const EntityAlpha = Module.cwrap('EntityAlpha', null, ['number', 'number']);
	const EntityBlend = Module.cwrap('EntityBlend', null, ['number', 'number']);
	const EntityBox = Module.cwrap('EntityBox', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
	const EntityClass = Module.cwrap('EntityClass', 'string', ['number']);
	const EntityCollided = Module.cwrap('EntityCollided', 'number', ['number', 'number']);
	const EntityColor = Module.cwrap('EntityColor', null, ['number', 'number', 'number', 'number']);
	const EntityDistance = Module.cwrap('EntityDistance', 'number', ['number', 'number']);
	const EntityFX = Module.cwrap('EntityFX', null, ['number', 'number']);
	const EntityInView = Module.cwrap('EntityInView', 'number', ['number', 'number']);
	const EntityName = Module.cwrap('EntityName', 'string', ['number']);
	const EntityOrder = Module.cwrap('EntityOrder', null, ['number', 'number']);
	const EntityParent = Module.cwrap('EntityParent', null, ['number', 'number', 'number']);
	const EntityPick = Module.cwrap('EntityPick', 'number', ['number', 'number']);
	const EntityPickMode = Module.cwrap('EntityPickMode', null, ['number', 'number', 'number']);
	const EntityPitch = Module.cwrap('EntityPitch', 'number', ['number', 'number']);
	const EntityRadius = Module.cwrap('EntityRadius', null, ['number', 'number', 'number']);
	const EntityRoll = Module.cwrap('EntityRoll', 'number', ['number', 'number']);
	const EntityShininess = Module.cwrap('EntityShininess', null, ['number', 'number']);
	const EntityTexture = Module.cwrap('EntityTexture', null, ['number', 'number', 'number', 'number']);
	const EntityType = Module.cwrap('EntityType', null, ['number', 'number', 'number']);
	const EntityVisible = Module.cwrap('EntityVisible', 'number', ['number', 'number']);
	const EntityX = Module.cwrap('EntityX', 'number', ['number', 'number']);
	const EntityY = Module.cwrap('EntityY', 'number', ['number', 'number']);
	const EntityYaw = Module.cwrap('EntityYaw', 'number', ['number', 'number']);
	const EntityZ = Module.cwrap('EntityZ', 'number', ['number', 'number']);
	const ExtractAnimSeq = Module.cwrap('ExtractAnimSeq', 'number', ['number', 'number', 'number', 'number']);
	const FindChild = Module.cwrap('FindChild', 'number', ['number', 'string']);
	const FitMesh = Module.cwrap('FitMesh', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
	const FlipMesh = Module.cwrap('FlipMesh', null, ['number']);
	const FluidThreshold = Module.cwrap('FluidThreshold', null, ['number', 'number']);
	const FreeBrush = Module.cwrap('FreeBrush', null, ['number']);
	const FreeConstraint = Module.cwrap('FreeConstraint', null, ['number']);
	const FreeEntity = Module.cwrap('FreeEntity', null, ['number']);
	const FreePostFX = Module.cwrap('FreePostFX', null, ['number']);
	const FreeRigidBody = Module.cwrap('FreeRigidBody', null, ['number']);
	const FreeShader = Module.cwrap('FreeShader', null, ['number']);
	const FreeShadow = Module.cwrap('FreeShadow', null, ['number']);
	const FreeTexture = Module.cwrap('FreeTexture', null, ['number']);
	const GeosphereHeight = Module.cwrap('GeosphereHeight', null, ['number', 'number']);
	const GetBone = Module.cwrap('GetBone', 'number', ['number', 'number']);
	const GetBrushTexture = Module.cwrap('GetBrushTexture', 'number', ['number', 'number']);
	const GetChild = Module.cwrap('GetChild', 'number', ['number', 'number']);
	const GetEntityBrush = Module.cwrap('GetEntityBrush', 'number', ['number']);
	const GetEntityType = Module.cwrap('GetEntityType', 'number', ['number']);
	const GetParentEntity = Module.cwrap('GetParentEntity', 'number', ['number']);
	const GetSurface = Module.cwrap('GetSurface', 'number', ['number', 'number']);
	const GetSurfaceBrush = Module.cwrap('GetSurfaceBrush', 'number', ['number']);
	const Graphics3D = Module.cwrap('Graphics3D', null, ['number', 'number', 'number', 'number', 'number']);
	const HandleSprite = Module.cwrap('HandleSprite', null, ['number', 'number', 'number']);
	const HideEntity = Module.cwrap('HideEntity', null, ['number']);
	const LightColor = Module.cwrap('LightColor', null, ['number', 'number', 'number', 'number']);
	const LightConeAngles = Module.cwrap('LightConeAngles', null, ['number', 'number', 'number']);
	const LightRange = Module.cwrap('LightRange', null, ['number', 'number']);
	const LinePick = Module.cwrap('LinePick', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']);
	const LoadAnimMesh = Module.cwrap('LoadAnimMesh', 'number', ['string', 'number']);
	const LoadAnimSeq = Module.cwrap('LoadAnimSeq', 'number', ['number', 'string']);
	const LoadAnimTexture = Module.cwrap('LoadAnimTexture', 'number', ['string', 'number', 'number', 'number', 'number', 'number']);
	const LoadBrush = Module.cwrap('LoadBrush', 'number', ['string', 'number', 'number', 'number']);
	const LoadGeosphere = Module.cwrap('LoadGeosphere', 'number', ['string', 'number']);
	const LoadMesh = Module.cwrap('LoadMesh', 'number', ['string', 'number']);
	const LoadTerrain = Module.cwrap('LoadTerrain', 'number', ['string', 'number']);
	const LoadTexture = Module.cwrap('LoadTexture', 'number', ['string', 'number']);
	const LoadSprite = Module.cwrap('LoadSprite', 'number', ['string', 'number', 'number']);
	const MeshCSG = Module.cwrap('MeshCSG', 'number', ['number', 'number', 'number']);
	const MeshDepth = Module.cwrap('MeshDepth', 'number', ['number']);
	const MeshesIntersect = Module.cwrap('MeshesIntersect', 'number', ['number', 'number']);
	const MeshHeight = Module.cwrap('MeshHeight', 'number', ['number']);
	const MeshWidth = Module.cwrap('MeshWidth', 'number', ['number']);
	const ModifyGeosphere = Module.cwrap('ModifyGeosphere', null, ['number', 'number', 'number', 'number']);
	const ModifyTerrain = Module.cwrap('ModifyTerrain', null, ['number', 'number', 'number', 'number']);
	const MoveBone = Module.cwrap('MoveBone', 'number', ['number', 'number', 'number', 'number', 'number']);
	const MoveEntity = Module.cwrap('MoveEntity', null, ['number', 'number', 'number', 'number']);
	const NameEntity = Module.cwrap('NameEntity', null, ['number', 'string']);
	const NameTexture = Module.cwrap('NameTexture', null, ['number', 'string']);
	const PaintEntity = Module.cwrap('PaintEntity', null, ['number', 'number']);
	const PaintMesh = Module.cwrap('PaintMesh', null, ['number', 'number']);
	const PaintSurface = Module.cwrap('PaintSurface', null, ['number', 'number']);
	const ParticleColor = Module.cwrap('ParticleColor', null, ['number', 'number', 'number', 'number', 'number']);
	const ParticleVector = Module.cwrap('ParticleVector', null, ['number', 'number', 'number', 'number']);
	const ParticleTrail = Module.cwrap('ParticleTrail', null, ['number', 'number']);
	const PickedEntity = Module.cwrap('PickedEntity', 'number', []);
	const PickedNX = Module.cwrap('PickedNX', 'number', []);
	const PickedNY = Module.cwrap('PickedNY', 'number', []);
	const PickedNZ = Module.cwrap('PickedNZ', 'number', []);
	const PickedSurface = Module.cwrap('PickedSurface', 'number', []);
	const PickedTime = Module.cwrap('PickedTime', 'number', []);
	const PickedTriangle = Module.cwrap('PickedTriangle', 'number', []);
	const PickedX = Module.cwrap('PickedX', 'number', []);
	const PickedY = Module.cwrap('PickedY', 'number', []);
	const PickedZ = Module.cwrap('PickedZ', 'number', []);
	const PointEntity = Module.cwrap('PointEntity', null, ['number', 'number', 'number']);
	const PositionBone = Module.cwrap('PositionBone', null, ['number', 'number', 'number', 'number']);
	const PositionEntity = Module.cwrap('PositionEntity', null, ['number', 'number', 'number', 'number', 'number']);
	const PositionMesh = Module.cwrap('PositionMesh', null, ['number', 'number', 'number', 'number']);
	const PositionTexture = Module.cwrap('PositionTexture', null, ['number', 'number', 'number']);
	const ProjectedX = Module.cwrap('ProjectedX', 'number', []);
	const ProjectedY = Module.cwrap('ProjectedY', 'number', []);
	const ProjectedZ = Module.cwrap('ProjectedZ', 'number', []);
	const RenderWorld = Module.cwrap('RenderWorld', null, []);
	const RepeatMesh = Module.cwrap('RepeatMesh', 'number', ['number', 'number']);
	const ResetEntity = Module.cwrap('ResetEntity', null, ['number']);
	const ResetShadow = Module.cwrap('ResetShadow', null, ['number']);
	const RotateBone = Module.cwrap('RotateBone', null, ['number', 'number', 'number', 'number']);
	const RotateEntity = Module.cwrap('RotateEntity', null, ['number', 'number', 'number', 'number', 'number']);
	const RotateMesh = Module.cwrap('RotateMesh', null, ['number', 'number', 'number', 'number']);
	const RotateSprite = Module.cwrap('RotateSprite', null, ['number', 'number']);
	const RotateTexture = Module.cwrap('RotateTexture', null, ['number', 'number']);
	const ScaleEntity = Module.cwrap('ScaleEntity', null, ['number', 'number', 'number', 'number', 'number']);
	const ScaleMesh = Module.cwrap('ScaleMesh', null, ['number', 'number', 'number', 'number']);
	const ScaleSprite = Module.cwrap('ScaleSprite', null, ['number', 'number', 'number']);
	const ScaleTexture = Module.cwrap('ScaleTexture', null, ['number', 'number', 'number']);
	const SetAnimKey = Module.cwrap('SetAnimKey', null, ['number', 'number', 'number', 'number', 'number']);
	const SetAnimTime = Module.cwrap('SetAnimTime', null, ['number', 'number', 'number']);
	const SetCubeFace = Module.cwrap('SetCubeFace', null, ['number', 'number']);
	const SetCubeMode = Module.cwrap('SetCubeMode', null, ['number', 'number']);
	const ShowEntity = Module.cwrap('ShowEntity', null, ['number']);
	const SkinMesh = Module.cwrap('SkinMesh', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
	const SpriteRenderMode = Module.cwrap('SpriteRenderMode', null, ['number', 'number']);
	const SpriteViewMode = Module.cwrap('SpriteViewMode', null, ['number', 'number']);
	const StencilAlpha = Module.cwrap('StencilAlpha', null, ['number', 'number']);
	const StencilClsColor = Module.cwrap('StencilClsColor', null, ['number', 'number', 'number', 'number']);
	const StencilClsMode = Module.cwrap('StencilClsMode', null, ['number', 'number', 'number']);
	const StencilMesh = Module.cwrap('StencilMesh', null, ['number', 'number', 'number']);
	const StencilMode = Module.cwrap('StencilMode', null, ['number', 'number', 'number']);
	const TerrainHeight = Module.cwrap('TerrainHeight', 'number', ['number', 'number', 'number']);
	const TerrainX = Module.cwrap('TerrainX', 'number', ['number', 'number', 'number', 'number']);
	const TerrainY = Module.cwrap('TerrainY', 'number', ['number', 'number', 'number', 'number']);
	const TerrainZ = Module.cwrap('TerrainZ', 'number', ['number', 'number', 'number', 'number']);
	const TextureBlend = Module.cwrap('TextureBlend', null, ['number', 'number']);
	const TextureCoords = Module.cwrap('TextureCoords', null, ['number', 'number']);
	const TextureHeight = Module.cwrap('TextureHeight', 'number', ['number']);
	const TextureFilter = Module.cwrap('TextureFilter', null, ['string', 'number']);
	const TextureName = Module.cwrap('TextureName', 'string', ['number']);
	const TextureWidth = Module.cwrap('TextureWidth', 'number', ['number']);
	const TFormedX = Module.cwrap('TFormedX', 'number', []);
	const TFormedY = Module.cwrap('TFormedY', 'number', []);
	const TFormedZ = Module.cwrap('TFormedZ', 'number', []);
	const TFormNormal = Module.cwrap('TFormNormal', null, ['number', 'number', 'number', 'number', 'number']);
	const TFormPoint = Module.cwrap('TFormPoint', null, ['number', 'number', 'number', 'number', 'number']);
	const TFormVector = Module.cwrap('TFormVector', null, ['number', 'number', 'number', 'number', 'number']);
	const TranslateEntity = Module.cwrap('TranslateEntity', null, ['number', 'number', 'number', 'number', 'number']);
	const TriangleVertex = Module.cwrap('TriangleVertex', 'number', ['number', 'number', 'number']);
	const TurnEntity = Module.cwrap('TurnEntity', null, ['number', 'number', 'number', 'number', 'number']);
	const UpdateNormals = Module.cwrap('UpdateNormals', null, ['number']);
	const UpdateTexCoords = Module.cwrap('UpdateTexCoords', null, ['number']);
	const UpdateWorld = Module.cwrap('UpdateWorld', null, ['number']);
	const UseStencil = Module.cwrap('UseStencil', null, ['number']);
	const VectorPitch = Module.cwrap('VectorPitch', 'number', ['number', 'number', 'number']);
	const VectorYaw = Module.cwrap('VectorYaw', 'number', ['number', 'number', 'number']);
	const VertexAlpha = Module.cwrap('VertexAlpha', 'number', ['number', 'number']);
	const VertexBlue = Module.cwrap('VertexBlue', 'number', ['number', 'number']);
	const VertexColor = Module.cwrap('VertexColor', null, ['number', 'number', 'number', 'number', 'number', 'number']);
	const VertexCoords = Module.cwrap('VertexCoords', null, ['number', 'number', 'number', 'number', 'number']);
	const VertexGreen = Module.cwrap('VertexGreen', 'number', ['number', 'number']);
	const VertexNormal = Module.cwrap('VertexNormal', null, ['number', 'number', 'number', 'number', 'number']);
	const VertexNX = Module.cwrap('VertexNX', 'number', ['number', 'number']);
	const VertexNY = Module.cwrap('VertexNY', 'number', ['number', 'number']);
	const VertexNZ = Module.cwrap('VertexNZ', 'number', ['number', 'number']);
	const VertexRed = Module.cwrap('VertexRed', 'number', ['number', 'number']);
	const VertexTexCoords = Module.cwrap('VertexTexCoords', null, ['number', 'number', 'number', 'number', 'number', 'number']);
	const VertexU = Module.cwrap('VertexU', 'number', ['number', 'number', 'number']);
	const VertexV = Module.cwrap('VertexV', 'number', ['number', 'number', 'number']);
	const VertexW = Module.cwrap('VertexW', 'number', ['number', 'number', 'number']);
	const VertexX = Module.cwrap('VertexX', 'number', ['number', 'number']);
	const VertexY = Module.cwrap('VertexY', 'number', ['number', 'number']);
	const VertexZ = Module.cwrap('VertexZ', 'number', ['number', 'number']);
	const VoxelSpriteMaterial = Module.cwrap('VoxelSpriteMaterial', null, ['number', 'number']);
	const Wireframe = Module.cwrap('Wireframe', null, ['number']);
	const EntityScaleX = Module.cwrap('EntityScaleX', 'number', ['number', 'number']);
	const EntityScaleY = Module.cwrap('EntityScaleY', 'number', ['number', 'number']);
	const EntityScaleZ = Module.cwrap('EntityScaleZ', 'number', ['number', 'number']);
	const LoadShader = Module.cwrap('LoadShader', 'number', ['string', 'string', 'string']);
	const CreateShader = Module.cwrap('CreateShader', 'number', ['string', 'string', 'string']);
	const LoadShaderVGF = Module.cwrap('LoadShaderVGF', 'number', ['string', 'string', 'string', 'string']);
	const CreateShaderVGF = Module.cwrap('CreateShaderVGF', 'number', ['string', 'string', 'string', 'string']);
	const ShadeSurface = Module.cwrap('ShadeSurface', null, ['number', 'number']);
	const ShadeMesh = Module.cwrap('ShadeMesh', null, ['number', 'number']);
	const ShadeEntity = Module.cwrap('ShadeEntity', null, ['number', 'number']);
	const ShaderTexture = Module.cwrap('ShaderTexture', null, ['number', 'number', 'string', 'number']);
	const SetFloat = Module.cwrap('SetFloat', null, ['number', 'string', 'number']);
	const SetFloat2 = Module.cwrap('SetFloat2', null, ['number', 'string', 'number', 'number']);
	const SetFloat3 = Module.cwrap('SetFloat3', null, ['number', 'string', 'number', 'number', 'number']);
	const SetFloat4 = Module.cwrap('SetFloat4', null, ['number', 'string', 'number', 'number', 'number', 'number']);
	const SetInteger = Module.cwrap('SetInteger', null, ['number', 'string', 'number']);
	const SetInteger2 = Module.cwrap('SetInteger2', null, ['number', 'string', 'number', 'number']);
	const SetInteger3 = Module.cwrap('SetInteger3', null, ['number', 'string', 'number', 'number', 'number']);
	const SetInteger4 = Module.cwrap('SetInteger4', null, ['number', 'string', 'number', 'number', 'number', 'number']);
	const UseSurface = Module.cwrap('UseSurface', null, ['number', 'string', 'number', 'number']);
	const UseMatrix = Module.cwrap('UseMatrix', null, ['number', 'string', 'number']);
	const UseEntity = Module.cwrap('UseEntity', null, ['number', 'string', 'number', 'number']);
	const LoadMaterial = Module.cwrap('LoadMaterial', 'number', ['string', 'number', 'number', 'number', 'number', 'number']);
	const ShaderMaterial = Module.cwrap('ShaderMaterial', null, ['number', 'number', 'string', 'number']);
	const AmbientShader = Module.cwrap('AmbientShader', null, ['number']);
	const GetShaderProgram = Module.cwrap('GetShaderProgram', 'number', ['number']);
	const CreateOcTree = Module.cwrap('CreateOcTree', 'number', ['number', 'number', 'number', 'number']);
	const OctreeBlock = Module.cwrap('OctreeBlock', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
	const OctreeMesh = Module.cwrap('OctreeMesh', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
	const CreateFluid = Module.cwrap('CreateFluid', 'number', []);
	const CreateParticleEmitter = Module.cwrap('CreateParticleEmitter', 'number', ['number', 'number']);
	const ActStop = Module.cwrap('ActStop', 'number', ['number']);
	const ActWait = Module.cwrap('ActWait', 'number', ['number']);
	const ActMoveBy = Module.cwrap('ActMoveBy', 'number', ['number', 'number', 'number', 'number', 'number']);
	const ActTurnBy = Module.cwrap('ActTurnBy', 'number', ['number', 'number', 'number', 'number', 'number']);
	const ActVector = Module.cwrap('ActVector', 'number', ['number', 'number', 'number', 'number']);
	const ActMoveTo = Module.cwrap('ActMoveTo', 'number', ['number', 'number', 'number', 'number', 'number']);
	const ActTurnTo = Module.cwrap('ActTurnTo', 'number', ['number', 'number', 'number', 'number', 'number']);
	const ActScaleTo = Module.cwrap('ActScaleTo', 'number', ['number', 'number', 'number', 'number', 'number']);
	const ActFadeTo = Module.cwrap('ActFadeTo', 'number', ['number', 'number', 'number']);
	const ActTintTo = Module.cwrap('ActTintTo', 'number', ['number', 'number', 'number', 'number', 'number']);
	const ActTrackByPoint = Module.cwrap('ActTrackByPoint', 'number', ['number', 'number', 'number', 'number', 'number', 'number']);
	const ActTrackByDistance = Module.cwrap('ActTrackByDistance', 'number', ['number', 'number', 'number', 'number']);
	const ActNewtonian = Module.cwrap('ActNewtonian', 'number', ['number', 'number']);
	const AppendAction = Module.cwrap('AppendAction', null, ['number', 'number']);
	const FreeAction = Module.cwrap('FreeAction', null, ['number', 'number']);
	const ActIterator = Module.cwrap('ActIterator', 'number', []);
	const TriggerCloseTo = Module.cwrap('TriggerCloseTo', 'number', ['number', 'number', 'number', 'number', 'number']);
	const TriggerDistance = Module.cwrap('TriggerDistance', 'number', ['number', 'number', 'number']);
	const TriggerCollision = Module.cwrap('TriggerCollision', 'number', ['number', 'number']);
	const CreatePostFX = Module.cwrap('CreatePostFX', 'number', ['number', 'number']);
	const AddRenderTarget = Module.cwrap('AddRenderTarget', null, ['number', 'number', 'number', 'number', 'number', 'number']);
	const PostFXShader = Module.cwrap('PostFXShader', null, ['number', 'number', 'number']);
	const PostFXShaderPass = Module.cwrap('PostFXShaderPass', null, ['number', 'number', 'string', 'number']);
	const PostFXBuffer = Module.cwrap('PostFXBuffer', null, ['number', 'number', 'number', 'number', 'number']);
	const PostFXTexture = Module.cwrap('PostFXTexture', null, ['number', 'number', 'number', 'number', 'number']);
	const CameraProjMatrix = Module.cwrap('CameraProjMatrix', 'number', ['number']);
	const EntityMatrix = Module.cwrap('EntityMatrix', 'number', ['number']);

	function AsyncLoadAnimMesh(filename, parent, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var mesh=LoadAnimMesh(filename, parent);
				callback(mesh);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadAnimSeq(ent, filename, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var i=LoadAnimSeq(ent, filename);
				callback(i);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadAnimTexture(filename, flags, frame_width, frame_height, first_frame, frame_count, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var tex=LoadAnimTexture(filename, flags,frame_width,frame_height,first_frame,frame_count);
				callback(tex);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadMaterial(filename, flags, frame_width, frame_height, first_frame, frame_count, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var mat=LoadMaterial(filename, flags,frame_width,frame_height,first_frame,frame_count);
				callback(mat);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadBrush(filename, flags, u_scale, v_scale, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var brush=LoadBrush(filename, flags, u_scale, v_scale);
				callback(brush);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadGeosphere(filename, parent, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var geo=LoadGeosphere(filename, parent);
				callback(geo);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadMesh(filename, parent, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var mesh=LoadMesh(filename, parent);
				callback(mesh);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadTerrain(filename, parent, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var terr=LoadTerrain(filename, parent);
				callback(terr);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadTexture(filename, flags, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var tex=LoadTexture(filename, flags);
				callback(tex);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadSprite(filename, flags, parent, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				var sprite=LoadSprite(filename, flags, parent);
				callback(sprite);
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function AsyncLoadShader(ShaderName, VshaderFileName, FshaderFileName, callback){
		AsyncLoadResource(VshaderFileName, _=>{
			AsyncLoadResource(FshaderFileName, _=>{
				var shader=LoadShader(ShaderName, VshaderFileName, FshaderFileName);
				callback(shader);
			});
		});
	}

	function AsyncLoadShaderVGF(ShaderName, VshaderFileName, GshaderFileName, FshaderFileName, callback){
		AsyncLoadResource(VshaderFileName, _=>{
			AsyncLoadResource(GshaderFileName, _=>{
				AsyncLoadResource(FshaderFileName, _=>{
					var shader=LoadShaderVGF(ShaderName, VshaderFileName, GshaderFileName, FshaderFileName);
					callback(shader);
				});
			});
		});
	}

	function AsyncLoadResource(filename, callback){
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = (event) => {
			const arrayBuffer = httpRequest.response;
			if (arrayBuffer) {
				const byteArray = new Uint8Array(arrayBuffer);
				FS.writeFile(filename, byteArray);
				callback();
			}
		}
		httpRequest.open("GET", filename);
		httpRequest.responseType="arraybuffer";
		httpRequest.send(null);
	}

	function BufferToTex (tex, buffer){
		GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex,"i32")]);
		GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, buffer);
		GLctx.generateMipmap(GLctx.TEXTURE_2D);
	}

